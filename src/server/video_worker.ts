/**
 * video_worker.ts
 * - Runs on your Mac Studio (or any machine with ffmpeg)
 * - Polls Mongo for Video docs with status="processing" that are not claimed
 * - Downloads master from R2, transcodes 720/1080/(optional 2160), uploads back to R2
 * - Updates Mongo to status="active" or "failed"
 *
 * Run from project root:
 *   npx tsx src/server/video_worker.ts
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// ✅ IMPORTANT: make sure this import path is correct for your repo.
import { VideoModel } from "../shared/interfaces.js";

type VideoJob = {
    videoId: string;
    master_mp4_path: string;
    make_4k?: boolean;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Load your local env file explicitly
dotenv.config({
    path: path.resolve(process.cwd(), ".env.development"),
});

const MONGODB_URI = process.env.MONGODB_URI || "";
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || "";
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || "";

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI (check .env.development)");
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Missing R2 env vars (check .env.development)");
}

const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

function publicUrlForKey(key: string) {
    if (!R2_PUBLIC_DOMAIN) return "";
    return `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${key}`;
}

async function streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const readable = stream as Readable;
    for await (const chunk of readable) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks);
}

async function downloadR2ObjectToFile(key: string, destPath: string) {
    const out = await r2.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    const body = (out as any).Body;
    if (!body) throw new Error(`R2 GetObject empty body for key: ${key}`);
    const buf = await streamToBuffer(body);
    await fs.writeFile(destPath, buf);
}

async function uploadFileToR2(key: string, filePath: string, contentType: string) {
    await r2.send(
        new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: await fs.readFile(filePath),
            ContentType: contentType,
        })
    );
}

function fileExistsAndNonEmpty(p: string) {
    try {
        return fsSync.existsSync(p) && fsSync.statSync(p).size > 0;
    } catch {
        return false;
    }
}

function runFfmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const p = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });

        let stderr = "";
        p.stderr.on("data", (d) => (stderr += d.toString()));

        p.on("error", reject);
        p.on("close", (code) => {
            if (code === 0) return resolve();
            reject(new Error(`ffmpeg exited ${code}. ${stderr.slice(-4000)}`));
        });
    });
}

/**
 * Mac hardware acceleration via videotoolbox (fast).
 * Output: H.264 + AAC in MP4.
 */
async function transcodeToMp4(inputPath: string, outPath: string, height: number) {
    const vf = `scale=-2:${height}`;

    const b = height === 720 ? "3500k" : height === 1080 ? "6000k" : "16000k";
    const max = height === 720 ? "4500k" : height === 1080 ? "8000k" : "20000k";
    const buf = height === 720 ? "9000k" : height === 1080 ? "16000k" : "40000k";

    await runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-vf",
        vf,
        "-c:v",
        "h264_videotoolbox",
        "-b:v",
        b,
        "-maxrate",
        max,
        "-bufsize",
        buf,
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-movflags",
        "+faststart",
        outPath,
    ]);

    if (!fileExistsAndNonEmpty(outPath)) throw new Error(`Transcode failed for ${height}p`);
}

function guessExtFromKey(key: string) {
    const lower = key.toLowerCase();
    if (lower.endsWith(".mp4")) return "mp4";
    if (lower.endsWith(".mov")) return "mov";
    if (lower.endsWith(".m4v")) return "m4v";
    return "mp4";
}

async function markFailed(videoId: string, message: string) {
    await (VideoModel as any).findOneAndUpdate(
        { videoId },
        {
            $set: {
                status: "failed",
                processing_lock: "",
            },
        },
        { new: true }
    );

    console.error("❌ Marked failed:", { videoId, message });
}

async function processOne(video: VideoJob, workerId: string) {
    const videoId = String(video.videoId);
    const masterKey = String(video.master_mp4_path || "");
    const do4k = !!video.make_4k;

    if (!masterKey) {
        await markFailed(videoId, "Missing master_mp4_path");
        return;
    }

    const tmpDir = path.join(os.tmpdir(), `blc-video-worker-${videoId}-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    console.log("🎬 Processing", { videoId, masterKey, do4k, workerId });

    try {
        const ext = guessExtFromKey(masterKey);
        const inputPath = path.join(tmpDir, `master.${ext}`);

        console.log("⬇️ Downloading master…");
        await downloadR2ObjectToFile(masterKey, inputPath);

        const out720 = path.join(tmpDir, "720p.mp4");
        const out1080 = path.join(tmpDir, "1080p.mp4");
        const out2160 = path.join(tmpDir, "2160p.mp4");

        console.log("🧱 Transcoding 720p…");
        await transcodeToMp4(inputPath, out720, 720);

        console.log("🧱 Transcoding 1080p…");
        await transcodeToMp4(inputPath, out1080, 1080);

        if (do4k) {
            console.log("🧱 Transcoding 2160p…");
            await transcodeToMp4(inputPath, out2160, 2160);
        }

        const k720 = `video/mp4/${videoId}/720p.mp4`;
        const k1080 = `video/mp4/${videoId}/1080p.mp4`;
        const k2160 = `video/mp4/${videoId}/2160p.mp4`;

        console.log("⬆️ Uploading 720p…");
        await uploadFileToR2(k720, out720, "video/mp4");

        console.log("⬆️ Uploading 1080p…");
        await uploadFileToR2(k1080, out1080, "video/mp4");

        if (do4k) {
            console.log("⬆️ Uploading 2160p…");
            await uploadFileToR2(k2160, out2160, "video/mp4");
        }

        await (VideoModel as any).findOneAndUpdate(
            { videoId },
            {
                $set: {
                    mp4_720_path: k720,
                    mp4_1080_path: k1080,
                    mp4_2160_path: do4k ? k2160 : "",
                    mp4_720_url: publicUrlForKey(k720),
                    mp4_1080_url: publicUrlForKey(k1080),
                    mp4_2160_url: do4k ? publicUrlForKey(k2160) : "",
                    status: "active",
                    processing_lock: "",
                },
            },
            { new: true }
        );

        console.log("✅ Done", { videoId, k720, k1080, do4k });
    } catch (err: any) {
        const msg = err?.message || String(err);
        console.error("❌ Failed", { videoId, msg });
        await markFailed(videoId, msg);
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

async function main() {
    await mongoose.connect(MONGODB_URI);

    console.log("✅ Worker connected to MongoDB");
    console.log("DB:", mongoose.connection.name);
    console.log("HOST:", mongoose.connection.host);

    const workerId = `${os.hostname()}-${process.pid}`;
    console.log("🧑‍🏭 workerId:", workerId);

    // helpful visibility at startup
    const counts = {
        total: await (VideoModel as any).countDocuments({}),
        processingAny: await (VideoModel as any).countDocuments({ status: "processing" }),
        processingUnlocked: await (VideoModel as any).countDocuments({
            status: "processing",
            $or: [{ processing_lock: { $in: ["", null] } }, { processing_lock: { $exists: false } }],
        }),
    };
    console.log("📊 counts at startup:", counts);

    const latest = await (VideoModel as any).findOne().sort({ updatedAt: -1 }).lean();
    console.log("🧪 latest doc:", latest);

    // graceful shutdown
    const shutdown = async () => {
        console.log("\n👋 Shutting down worker…");
        try {
            await mongoose.disconnect();
        } catch { }
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    while (true) {
        console.log("🔎 Polling for job…");

        // ✅ FIX: the cast prevents TS from thinking this might be an array-type lean result
        const job = (await (VideoModel as any)
            .findOneAndUpdate(
                {
                    status: "processing",
                    $or: [
                        { processing_lock: { $in: ["", null] } },
                        { processing_lock: { $exists: false } },
                    ],
                },
                {
                    $set: {
                        processing_lock: workerId,
                        processing_started_at: new Date(),
                    },
                },
                { sort: { updatedAt: 1 }, new: true }
            )
            .lean()) as VideoJob | null;

        if (!job) {
            console.log("…no jobs found (sleeping)");
            await sleep(2000);
            continue;
        }

        console.log("✅ Claimed job:", {
            videoId: job.videoId,
            master: job.master_mp4_path,
            make_4k: !!job.make_4k,
        });

        await processOne(job, workerId);
    }
}

main().catch((e) => {
    console.error("Worker crashed:", e);
    process.exit(1);
});