import "dotenv/config";
import mongoose from "mongoose";
import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";


// IMPORTANT: adjust this import to wherever your VideoModel lives
import { VideoModel } from "shared/interfaces.js"; // <-- if your models are exported there
// If VideoModel is not exported there, import it from the file where you defined it.

const MONGODB_URI = process.env.MONGODB_URI!;
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN!;

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    throw new Error("Missing R2 env vars");
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
    // scale to height, keep aspect ratio, even width/height
    // -2 makes ffmpeg pick an even number automatically
    const vf = `scale=-2:${height}`;

    await runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-vf",
        vf,
        "-c:v",
        "h264_videotoolbox",
        "-b:v",
        height === 720 ? "3500k" : height === 1080 ? "6000k" : "16000k",
        "-maxrate",
        height === 720 ? "4500k" : height === 1080 ? "8000k" : "20000k",
        "-bufsize",
        height === 720 ? "9000k" : height === 1080 ? "16000k" : "40000k",
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

async function processOne(video: any) {
    const videoId = video.videoId as string;
    const masterKey = video.master_mp4_path as string;
    const do4k = !!video.make_4k;

    const tmpDir = path.join(os.tmpdir(), `blc-video-worker-${videoId}-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    console.log("🎬 Processing", { videoId, masterKey, do4k });

    try {
        const ext = guessExtFromKey(masterKey);
        const inputPath = path.join(tmpDir, `master.${ext}`);

        await downloadR2ObjectToFile(masterKey, inputPath);

        const out720 = path.join(tmpDir, "720p.mp4");
        const out1080 = path.join(tmpDir, "1080p.mp4");
        const out2160 = path.join(tmpDir, "2160p.mp4");

        await transcodeToMp4(inputPath, out720, 720);
        await transcodeToMp4(inputPath, out1080, 1080);
        if (do4k) await transcodeToMp4(inputPath, out2160, 2160);

        const k720 = `video/mp4/${videoId}/720p.mp4`;
        const k1080 = `video/mp4/${videoId}/1080p.mp4`;
        const k2160 = `video/mp4/${videoId}/2160p.mp4`;

        await uploadFileToR2(k720, out720, "video/mp4");
        await uploadFileToR2(k1080, out1080, "video/mp4");
        if (do4k) await uploadFileToR2(k2160, out2160, "video/mp4");

        await VideoModel.findOneAndUpdate(
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
                },
            },
            { new: true }
        );

        console.log("✅ Done", { videoId, k720, k1080, do4k });
    } catch (err: any) {
        console.error("❌ Failed", { videoId, err: err?.message || err });

        await VideoModel.findOneAndUpdate(
            { videoId },
            { $set: { status: "failed" } },
            { new: true }
        );
    } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
}

async function main() {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Worker connected to MongoDB");

    // Poll forever
    const workerId = `${os.hostname()}-${process.pid}`;

    while (true) {
        const job = await VideoModel.findOneAndUpdate(
            {
                status: "processing",
                processing_lock: { $in: ["", null] }, // only unclaimed
            },
            {
                $set: {
                    processing_lock: workerId,
                    processing_started_at: new Date(),
                },
            },
            {
                sort: { updatedAt: 1 },
                new: true,
            }
        ).lean();

        if (!job) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
        }

        await processOne(job);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});