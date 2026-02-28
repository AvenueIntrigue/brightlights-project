import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";
import crypto from "crypto";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { spawn } from "child_process";
import { Readable } from "stream";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { clerkClient } from "@clerk/clerk-sdk-node";

import {
  PricingPostModel,
  AboutPostModel,
  ServicesPostModel,
  Web3PostModel,
  TopContainerContentModel,
  MiddleContainerContentModel,
  BulletContainerContentModel,
  web3ContainerContentModel,
  BulletContainerAboutUsModel,
  CategoryModel,
  GraphicDesignPostModel,
  AppDevelopmentPostModel,
  WebDevelopmentPostModel,
  ProjectsPostModel,
  PortfolioPostModel,
  marketingConsentContentModel,
  LessonsModel,
  MusicTrackModel,
  MusicAlbumModel,
  VideoModel,
} from "../shared/interfaces.js";

// ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config();

/**
 * ✅ MongoDB URI
 */
const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017/brightLightsCreative";
const uri = rawUri.startsWith("MONGODB_URI=") ? rawUri.replace("MONGODB_URI=", "") : rawUri;

/**
 * ✅ Encryption key (keep if used elsewhere)
 */
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be set and be 32 characters long.");
}

const dailyTopics = [
  "love",
  "joy",
  "peace",
  "patience",
  "kindness",
  "goodness",
  "faithfulness",
  "gentleness",
  "self-control",
  "family",
  "christian_living",
  "forgiveness",
  "repentance",
  "gratitude",
  "hope",
  "humility",
  "obedience",
  "called_to_create",
  "honor_god_in_your_work",
  "liberty",
  "bread_of_life",
  "living_water",
  "provision",
  "holy_spirit_guidance",
  "follower_of_christ",
  "salvation",
] as const;

const app = express();

/**
 * ✅ Cloudflare R2 env vars
 */
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

const r2 =
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    ? new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
    : null;

function isR2Configured() {
  return !!(r2 && R2_BUCKET_NAME && R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

/**
 * ✅ Admin auth middleware
 */
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Bearer token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const claims = await clerkClient.verifyToken(token);
    const userId = (claims as any).sub;
    if (!userId) return res.status(401).json({ message: "Token missing sub" });

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;

    if (role !== "Admin") {
      return res.status(403).json({ message: "Forbidden (not Admin)" });
    }

    (req as any).user = claims;
    next();
  } catch (err: any) {
    console.error("Token verification error:", err?.reason || err?.message || err);
    return res.status(401).json({
      message: "Invalid token",
      reason: err?.reason,
    });
  }
};

/**
 * ✅ CORS
 */
app.use(
  cors({
    origin: [
      "https://www.brightlightscreative.com",
      "https://brightlightscreative.com",
      "https://brightlights-project.onrender.com",
      "https://upload.brightlightscreative.com",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.options("*", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// Body parsing (uploads are multipart/multer)
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

/**
 * ✅ Multer disk storage
 */
function sanitizeName(name: string) {
  return name.trim().replace(/\s+/g, "_").replace(/[^\w.\-]/g, "_");
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => cb(null, `${Date.now()}_${sanitizeName(file.originalname)}`),
  }),
  limits: {
    fileSize: 250 * 1024 * 1024, // per file
    files: 60,
  },
});

/**
 * ✅ Utilities
 */
function safeJson<T>(value: any): T | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function makeUploadId() {
  return crypto.randomBytes(16).toString("hex");
}

function isWavFile(f: Express.Multer.File) {
  const nameOk = f.originalname.toLowerCase().endsWith(".wav");
  const mimeOk =
    !f.mimetype ||
    f.mimetype === "audio/wav" ||
    f.mimetype === "audio/x-wav" ||
    f.mimetype === "audio/wave" ||
    f.mimetype === "audio/vnd.wave";
  return nameOk && mimeOk;
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

    p.on("error", (e) => reject(e));
    p.on("close", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}. ${stderr.slice(-4000)}`));
    });
  });
}

/**
 * MP3 encoding: libmp3lame often missing on managed hosts.
 * Try libmp3lame first, fallback to "mp3".
 */
async function wavToMp3(wavPath: string, mp3Path: string) {
  try {
    await runFfmpeg([
      "-y",
      "-i",
      wavPath,
      "-vn",
      "-c:a",
      "libmp3lame",
      "-b:a",
      "320k",
      "-ar",
      "44100",
      mp3Path,
    ]);
  } catch (e) {
    await runFfmpeg([
      "-y",
      "-i",
      wavPath,
      "-vn",
      "-c:a",
      "mp3",
      "-b:a",
      "320k",
      "-ar",
      "44100",
      mp3Path,
    ]);
  }

  if (!fileExistsAndNonEmpty(mp3Path)) {
    throw new Error("MP3 file was not created by ffmpeg (encoder unavailable or conversion failed).");
  }
}

async function wavToM4a(wavPath: string, m4aPath: string) {
  await runFfmpeg([
    "-y",
    "-i",
    wavPath,
    "-vn",
    "-c:a",
    "aac",
    "-b:a",
    "256k",
    "-ar",
    "44100",
    m4aPath,
  ]);

  if (!fileExistsAndNonEmpty(m4aPath)) {
    throw new Error("M4A file was not created by ffmpeg.");
  }
}

/**
 * ✅ Health
 */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "unknown" });
});

/**
 * =========================
 * LESSONS
 * =========================
 */
app.get("/api/lessons/:topic/:order", async (req: Request, res: Response) => {
  const { topic, order } = req.params;

  if (!dailyTopics.includes(topic as any)) {
    return res.status(400).json({ message: `Invalid topic: ${topic}` });
  }

  const orderNum = parseInt(order, 10);
  if (isNaN(orderNum) || orderNum < 1) {
    return res.status(400).json({ message: `Invalid order: ${order}` });
  }

  try {
    const lesson = await LessonsModel.findOne({ topic, order: orderNum });
    if (lesson) return res.json(lesson);
    return res.status(404).json({ message: `Lesson not found for ${topic} order ${order}` });
  } catch (error: any) {
    console.error(`Error fetching lesson ${topic}/${order}: ${error.message}`);
    return res.status(500).json({ message: "Error fetching lesson", error: error.message });
  }
});

app.post("/api/lessons", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { topic, title, scripture, reflection, action_item, prayer } = req.body;

    if (!dailyTopics.includes(topic)) {
      return res.status(400).json({ message: `Invalid topic: ${topic}` });
    }

    let nextOrder = 1;
    const lastLesson = await LessonsModel.findOne({ topic }).sort({ order: -1 }).select("order").exec();
    if (lastLesson && typeof lastLesson.order === "number") nextOrder = lastLesson.order + 1;

    if (!topic || !title || !scripture || !reflection || !action_item || !prayer) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (typeof scripture !== "string" || scripture.length < 100) {
      return res.status(400).json({ message: "Scripture must be at least 100 characters" });
    }

    const lesson = new LessonsModel({ topic, title, scripture, order: nextOrder, reflection, action_item, prayer });
    await lesson.save();

    return res.status(201).json({ message: "Lesson saved successfully", lesson: lesson.toObject() });
  } catch (error: any) {
    console.error("Error saving lesson:", error);
    return res.status(500).json({ message: "Error saving lesson", error: error.message || "Unknown server error" });
  }
});

/**
 * =========================
 * MUSIC (Admin)
 * =========================
 */

async function streamToBuffer(stream: any): Promise<Buffer> {
  // AWS SDK v3 returns Body as a stream in Node
  const chunks: Buffer[] = [];
  const readable = stream as Readable;
  for await (const chunk of readable) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

async function downloadR2ObjectToFile(key: string, destPath: string) {
  const out = await r2!.send(
    new GetObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
    })
  );
  const body = (out as any).Body;
  if (!body) throw new Error(`R2 GetObject returned empty body for key: ${key}`);
  const buf = await streamToBuffer(body);
  await fs.writeFile(destPath, buf);
}

async function transcodeAndUploadStreamsFromMaster(masterKey: string, base: string, tmpDir: string) {
  const wavPath = path.join(tmpDir, `${base}.wav`);
  const mp3Path = path.join(tmpDir, `${base}.mp3`);
  const m4aPath = path.join(tmpDir, `${base}.m4a`);

  await downloadR2ObjectToFile(masterKey, wavPath);

  await wavToMp3(wavPath, mp3Path);
  await wavToM4a(wavPath, m4aPath);

  const mp3Key = `audio/mp3/${base}.mp3`;
  const m4aKey = `audio/m4a/${base}.m4a`;

  await r2!.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: mp3Key,
      Body: await fs.readFile(mp3Path),
      ContentType: "audio/mpeg",
    })
  );

  await r2!.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: m4aKey,
      Body: await fs.readFile(m4aPath),
      ContentType: "audio/mp4",
    })
  );

  const mp3Url = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${mp3Key}` : "";
  const m4aUrl = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${m4aKey}` : "";

  return { mp3Key, m4aKey, mp3Url, m4aUrl };
}

function guessExtFromKey(key: string) {
  const m = key.toLowerCase().match(/\.(mp4|mov|m4v|webm|mkv)$/);
  return m ? m[1] : "mp4";
}

async function transcodeVideoToMp4(inputPath: string, outputPath: string, height: 720 | 1080 | 2160) {
  // H.264 + AAC + faststart
  await runFfmpeg([
    "-y",
    "-i", inputPath,
    "-vf", `scale=-2:${height}`,
    "-c:v", "libx264",
    "-profile:v", "high",
    "-preset", "veryfast",
    "-crf", "22",
    "-c:a", "aac",
    "-b:a", height === 2160 ? "192k" : height === 1080 ? "160k" : "128k",
    "-movflags", "+faststart",
    outputPath,
  ]);

  if (!fileExistsAndNonEmpty(outputPath)) {
    throw new Error(`Video MP4 ${height}p was not created by ffmpeg.`);
  }
}

async function uploadFileToR2(key: string, filePath: string, contentType: string) {
  await r2!.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      Body: await fs.readFile(filePath),
      ContentType: contentType,
    })
  );
}

function publicUrlForKey(key: string) {
  return R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${key}` : "";
}

/**
 * Presign endpoint for client direct-to-R2 uploads (music + video)
 */
/**
 * Presign endpoint for client direct-to-R2 uploads
 * - Music:
 *   - cover (ContentType pinned)
 *   - master WAV (ContentType pinned)
 * - Video:
 *   - video_master (ContentType NOT pinned)
 *   - video_poster (ContentType NOT pinned)
 */
app.post("/api/r2/presign", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
    }

    const {
      kind,
      // music fields
      albumTitle,
      artist,
      trackNumber,
      // video fields
      videoId,
      // shared
      filename,
      contentType,
    } = req.body as {
      kind: "cover" | "master" | "video_master" | "video_poster";
      albumTitle?: string;
      artist?: string;
      trackNumber?: number;
      videoId?: string;
      filename: string;
      contentType?: string;
    };

    if (!kind || !filename) {
      return res.status(400).json({ message: "Missing required fields: kind, filename" });
    }

    const safeFile = sanitizeName(filename);

    // Build object key depending on kind
    let key = "";

    if (kind === "cover") {
      const safeArtist = sanitizeName((artist || "Great_Light").trim());
      const safeAlbum = sanitizeName((albumTitle || "Untitled_Album").trim());
      key = `covers/${safeArtist}/${safeAlbum}/${Date.now()}_${safeFile}`;
    } else if (kind === "master") {
      const safeArtist = sanitizeName((artist || "Great_Light").trim());
      const safeAlbum = sanitizeName((albumTitle || "Untitled_Album").trim());
      key = `audio/master/${safeArtist}/${safeAlbum}/track_${String(trackNumber ?? 0).padStart(
        2,
        "0"
      )}_${Date.now()}_${safeFile}`;
    } else if (kind === "video_master") {
      if (!videoId) {
        return res.status(400).json({ message: "Missing required field: videoId (for video_master)" });
      }
      key = `video/master/${sanitizeName(videoId)}/${Date.now()}_${safeFile}`;
    } else if (kind === "video_poster") {
      if (!videoId) {
        return res.status(400).json({ message: "Missing required field: videoId (for video_poster)" });
      }
      key = `video/posters/${sanitizeName(videoId)}/${Date.now()}_${safeFile}`;
    } else {
      return res.status(400).json({ message: `Invalid kind: ${kind}` });
    }

    // Build PutObjectCommand params.
    // ✅ Pin ContentType ONLY for cover + audio master
    // ❌ Do NOT pin ContentType for video_* (avoids signature mismatch + CORS header issues)
    const cmdParams: {
      Bucket: string;
      Key: string;
      ContentType?: string;
    } = {
      Bucket: R2_BUCKET_NAME!,
      Key: key,
    };

    if (kind === "cover") {
      cmdParams.ContentType = contentType || "image/jpeg";
    }

    if (kind === "master") {
      // For WAV, pick ONE stable value and use it consistently
      cmdParams.ContentType = contentType || "audio/wav";
    }

    const cmd = new PutObjectCommand(cmdParams);

    const putUrl = await getSignedUrl(r2!, cmd, { expiresIn: 60 * 30 });
    return res.json({ key, putUrl });
  } catch (err: any) {
    console.error("Presign error:", err);
    return res.status(500).json({ message: "Failed to presign upload", error: err.message });
  }
});
app.post("/api/albums/commit", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { album_title, artist = "Great Light", album_is_premium = true, cover_key, tracks } = req.body as {
      album_title: string;
      artist: string;
      album_is_premium: boolean;
      cover_key: string;
      tracks: Array<{
        title: string;
        track_number: number;
        track_is_premium?: boolean | null;
        master_wav_key: string;
        // if you ever add these later:
        stream_mp3_key?: string;
        stream_m4a_key?: string;
      }>;
    };

    if (!album_title || !cover_key || !tracks?.length) {
      return res.status(400).json({ message: "Missing album_title, cover_key, or tracks." });
    }

    console.log("✅ COMMIT HANDLER HIT");
    console.log("tracks count:", tracks.length);
    console.log("first master key:", tracks[0]?.master_wav_key);

    const albumDoc = await MusicAlbumModel.findOneAndUpdate(
      { title: String(album_title).trim(), artist: String(artist).trim() },
      {
        $setOnInsert: {
          title: String(album_title).trim(),
          artist: String(artist).trim(),
        },
        $set: {
          album_is_premium: !!album_is_premium,
          cover_path: cover_key,
          cover_url: "",
          status: "active",
        },
      },
      { new: true, upsert: true }
    );

    const createdTracks: any[] = [];
    const requestId = makeUploadId();
    const tmpDir = path.join(os.tmpdir(), `blc-commit-${requestId}`);
    await fs.mkdir(tmpDir, { recursive: true });
    try {
      for (const t of tracks) {
        const trackDoc = new MusicTrackModel({
          albumId: albumDoc._id,
          title: String(t.title).trim(),
          track_number: Number(t.track_number),
          track_is_premium: typeof t.track_is_premium === "boolean" ? t.track_is_premium : undefined,

          master_wav_path: t.master_wav_key,

          // will be filled in after transcode
          stream_mp3_url: "",
          stream_mp3_path: "",
          stream_m4a_url: "",
          stream_m4a_path: "",

          status: "active",
        });

        await trackDoc.save();

        // ✅ THIS is the missing step: make MP3+M4A from the WAV already in R2, upload them, then save paths.
        const base = `${sanitizeName(artist)}_${sanitizeName(album_title)}_track_${String(t.track_number).padStart(2, "0")}_${Date.now()}`;

        const { mp3Key, m4aKey, mp3Url, m4aUrl } = await transcodeAndUploadStreamsFromMaster(
          t.master_wav_key,
          base,
          tmpDir
        );
        console.log("✅ transcode done:", { mp3Key, m4aKey });
        trackDoc.stream_mp3_path = mp3Key;
        trackDoc.stream_mp3_url = mp3Url;
        trackDoc.stream_m4a_path = m4aKey;
        trackDoc.stream_m4a_url = m4aUrl;


        console.log("🎛️ transcoding track", t.track_number, "key:", t.master_wav_key);
        await trackDoc.save();

        createdTracks.push(trackDoc);
      }
    }
    finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    return res.status(201).json({
      message: "Album committed successfully",
      album: albumDoc,
      tracks: createdTracks,
    });
  } catch (err: any) {
    console.error("Commit album error:", err);

    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate track number or album.", error: err.message });
    }

    return res.status(500).json({ message: "Failed to commit album", error: err.message });
  }

});

/**
 * POST /api/albums
 * cover: 1 image
 * tracks: up to 10 WAV masters
 *
 * Converts:
 * - WAV -> MP3 (320k)  (libmp3lame -> fallback mp3)
 * - WAV -> M4A (AAC 256k)
 */
app.post(
  "/api/albums",
  requireAdmin,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "tracks", maxCount: 10 },
  ]),
  async (req: Request, res: Response) => {
    const requestId = makeUploadId();
    const tmpDir = path.join(os.tmpdir(), `blc-upload-${requestId}`);

    const cleanupPaths: string[] = [];

    try {
      if (!isR2Configured()) {
        return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const coverFile = files?.cover?.[0] ?? null;
      const trackFiles = files?.tracks ?? [];

      const {
        album_title,
        artist = "Great Light",
        album_is_premium = "true",
        track_titles,
        track_numbers,
        track_is_premium,
      } = req.body;

      if (!album_title || !coverFile || trackFiles.length === 0) {
        return res.status(400).json({
          message: "Missing required fields: album_title, cover, and at least 1 track file.",
          requestId,
        });
      }

      const bad = trackFiles.find((f) => !isWavFile(f));
      if (bad) {
        return res.status(400).json({
          message: `Only .wav master files are allowed. "${bad.originalname}" is not WAV.`,
          requestId,
        });
      }

      const parsedTitles = safeJson<string[]>(track_titles);
      const parsedNumbers = safeJson<number[]>(track_numbers);
      const parsedPremiumOverrides = safeJson<(boolean | null | undefined)[]>(track_is_premium);

      await fs.mkdir(tmpDir, { recursive: true });
      cleanupPaths.push(tmpDir);

      // ---- Upload cover (disk -> R2) ----
      cleanupPaths.push(coverFile.path);

      const coverKey = `covers/${Date.now()}_${sanitizeName(coverFile.originalname)}`;
      const coverBytes = await fs.readFile(coverFile.path);

      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: coverKey,
          Body: coverBytes,
          ContentType: coverFile.mimetype || "image/jpeg",
        })
      );

      const coverUrl = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${coverKey}` : "";

      // ---- Create/reuse album doc ----
      const albumDoc = await MusicAlbumModel.findOneAndUpdate(
        { title: String(album_title).trim(), artist: String(artist).trim() },
        {
          $setOnInsert: {
            title: String(album_title).trim(),
            artist: String(artist).trim(),
          },
          $set: {
            album_is_premium: album_is_premium === "true" || album_is_premium === true,
            cover_url: coverUrl,
            cover_path: coverKey,
            status: "active",
          },
        },
        { new: true, upsert: true }
      );

      const createdTracks: any[] = [];
      const sortedTrackFiles = [...trackFiles].sort((a, b) => a.originalname.localeCompare(b.originalname));

      for (let i = 0; i < sortedTrackFiles.length; i++) {
        const f = sortedTrackFiles[i];
        cleanupPaths.push(f.path);

        const title = parsedTitles?.[i] || f.originalname.replace(/\.[^/.]+$/, "");
        const trackNumber = parsedNumbers?.[i] ?? i + 1;
        const overridePremium = parsedPremiumOverrides?.[i];

        const base = `${Date.now()}_${i + 1}_${sanitizeName(f.originalname).replace(/\.wav$/i, "")}`;

        const wavPath = f.path;
        const mp3Path = path.join(tmpDir, `${base}.mp3`);
        const m4aPath = path.join(tmpDir, `${base}.m4a`);
        cleanupPaths.push(mp3Path, m4aPath);

        // WAV -> MP3 (with fallback)
        await wavToMp3(wavPath, mp3Path);

        // WAV -> M4A
        await wavToM4a(wavPath, m4aPath);

        // Upload master WAV
        const masterKey = `audio/master/${base}.wav`;
        await r2!.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: masterKey,
            Body: await fs.readFile(wavPath),
            ContentType: "audio/wav",
          })
        );

        // Upload MP3
        const mp3Key = `audio/mp3/${base}.mp3`;
        await r2!.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: mp3Key,
            Body: await fs.readFile(mp3Path),
            ContentType: "audio/mpeg",
          })
        );

        // Upload M4A
        const m4aKey = `audio/m4a/${base}.m4a`;
        await r2!.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: m4aKey,
            Body: await fs.readFile(m4aPath),
            ContentType: "audio/mp4",
          })
        );

        const mp3Url = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${mp3Key}` : "";
        const m4aUrl = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${m4aKey}` : "";

        const trackDoc = new MusicTrackModel({
          albumId: albumDoc._id,
          title: String(title).trim(),
          track_number: Number(trackNumber),
          track_is_premium: typeof overridePremium === "boolean" ? overridePremium : undefined,

          stream_mp3_url: mp3Url,
          stream_mp3_path: mp3Key,
          stream_m4a_url: m4aUrl,
          stream_m4a_path: m4aKey,
          master_wav_path: masterKey,

          status: "active",
        });

        await trackDoc.save();
        createdTracks.push(trackDoc);
      }

      return res.status(201).json({
        message: "Album uploaded successfully",
        requestId,
        album: albumDoc,
        tracks: createdTracks,
      });
    } catch (err: any) {
      console.error("Album upload error:", { requestId, err });

      if (err?.code === 11000) {
        return res.status(409).json({
          message: "Duplicate detected (album title+artist or track number).",
          requestId,
          error: err.message,
        });
      }

      return res.status(500).json({
        message: "Failed to upload album",
        requestId,
        error: err.message,
      });
    } finally {
      for (const p of cleanupPaths.reverse()) {
        try {
          await fs.rm(p, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
    }
  }
);

// GET /api/albums (Admin)
app.get("/api/albums", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const albums = await MusicAlbumModel.find({ status: { $ne: "archived" } })
      .sort({ createdAt: -1 })
      .select("_id title artist album_is_premium cover_url status createdAt")
      .lean();

    return res.json({ albums });
  } catch (err: any) {
    console.error("List albums error:", err);
    return res.status(500).json({ message: "Failed to list albums", error: err.message });
  }
});

// POST /api/albums/:albumId/tracks (Admin)
app.post(
  "/api/albums/:albumId/tracks",
  requireAdmin,
  upload.single("audio"),
  async (req: Request, res: Response) => {
    const requestId = makeUploadId();
    const tmpDir = path.join(os.tmpdir(), `blc-addtrack-${requestId}`);
    const cleanupPaths: string[] = [];

    try {
      if (!isR2Configured()) {
        return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
      }

      const { albumId } = req.params;
      const { title, track_number, track_is_premium } = req.body;
      const audioFile = req.file;

      if (!title || !track_number || !audioFile) {
        return res.status(400).json({ message: "Missing required fields or audio file" });
      }

      if (!isWavFile(audioFile)) {
        return res.status(400).json({ message: `Only .wav master files allowed. Got "${audioFile.originalname}".` });
      }

      const album = await MusicAlbumModel.findById(albumId);
      if (!album) return res.status(404).json({ message: "Album not found" });

      await fs.mkdir(tmpDir, { recursive: true });
      cleanupPaths.push(tmpDir, audioFile.path);

      const base = `${Date.now()}_${sanitizeName(audioFile.originalname).replace(/\.wav$/i, "")}`;
      const wavPath = audioFile.path;
      const mp3Path = path.join(tmpDir, `${base}.mp3`);
      const m4aPath = path.join(tmpDir, `${base}.m4a`);
      cleanupPaths.push(mp3Path, m4aPath);

      await wavToMp3(wavPath, mp3Path);
      await wavToM4a(wavPath, m4aPath);

      const masterKey = `audio/master/${base}.wav`;
      const mp3Key = `audio/mp3/${base}.mp3`;
      const m4aKey = `audio/m4a/${base}.m4a`;

      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: masterKey,
          Body: await fs.readFile(wavPath),
          ContentType: "audio/wav",
        })
      );

      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: mp3Key,
          Body: await fs.readFile(mp3Path),
          ContentType: "audio/mpeg",
        })
      );

      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: m4aKey,
          Body: await fs.readFile(m4aPath),
          ContentType: "audio/mp4",
        })
      );

      const mp3Url = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${mp3Key}` : "";
      const m4aUrl = R2_PUBLIC_DOMAIN ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${m4aKey}` : "";

      const track = new MusicTrackModel({
        albumId: album._id,
        title: String(title).trim(),
        track_number: parseInt(track_number, 10),
        track_is_premium:
          track_is_premium === undefined ? undefined : track_is_premium === "true" || track_is_premium === true,

        stream_mp3_url: mp3Url,
        stream_mp3_path: mp3Key,
        stream_m4a_url: m4aUrl,
        stream_m4a_path: m4aKey,
        master_wav_path: masterKey,

        status: "active",
      });

      await track.save();
      return res.status(201).json({ message: "Track added successfully", track });
    } catch (err: any) {
      console.error("Add track error:", err);
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Track number already exists for this album.", error: err.message });
      }
      return res.status(500).json({ message: "Failed to add track", error: err.message });
    } finally {
      for (const p of cleanupPaths.reverse()) {
        try {
          await fs.rm(p, { recursive: true, force: true });
        } catch {
          // ignore
        }
      }
    }
  }
);

// GET /api/music/signed-url/:trackId (Admin)
app.get("/api/music/signed-url/:trackId", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
    }

    const trackId = req.params.trackId;
    const track = await MusicTrackModel.findById(trackId);
    if (!track) return res.status(404).json({ message: "Track not found" });

    const key = (track as any).stream_mp3_path || (track as any).stream_m4a_path;
    if (!key) return res.status(400).json({ message: "Track has no stream path yet." });

    const command = new GetObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key });
    const signedUrl = await getSignedUrl(r2!, command, { expiresIn: 3600 });
    return res.json({ signedUrl });
  } catch (err: any) {
    console.error("Signed URL error:", err);
    return res.status(500).json({ message: "Failed to generate URL", error: err.message });
  }
});



/**
 * =========================
 * VIDEO (Admin)
 * =========================
 */




app.post("/api/videos/commit", requireAdmin, async (req: Request, res: Response) => {
  const requestId = makeUploadId();

  try {
    if (!isR2Configured()) {
      return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
    }

    const {
      videoId,
      title,
      artist = "Great Light",
      description = "",
      video_is_premium = true,
      master_key,
      poster_key = "",
      make_4k = false,
    } = req.body as {
      videoId: string;
      title: string;
      artist?: string;
      description?: string;
      video_is_premium?: boolean;
      master_key: string;
      poster_key?: string;
      make_4k?: boolean;
    };

    console.log("✅ VIDEO COMMIT HIT", {
      requestId,
      videoId,
      title,
      master_key,
      poster_key,
      make_4k,
    });

    if (!videoId || !title || !master_key) {
      return res.status(400).json({ message: "Missing videoId, title, or master_key." });
    }

    const videoDoc = await VideoModel.findOneAndUpdate(
      { videoId },
      {
        $setOnInsert: { videoId },

        $set: {
          // allow metadata edits on re-commit
          title: String(title).trim(),
          artist: String(artist).trim(),
          description: String(description || ""),
          video_is_premium: !!video_is_premium,

          master_mp4_path: master_key,
          poster_path: poster_key || "",
          poster_url: poster_key ? publicUrlForKey(poster_key) : "",

          // queue it
          status: "processing",
          make_4k: !!make_4k,

          // IMPORTANT: clear lock so the worker can claim it
          processing_lock: "",
          processing_started_at: null,

          // clear outputs on re-commit
          mp4_720_path: "",
          mp4_1080_path: "",
          mp4_2160_path: "",
          mp4_720_url: "",
          mp4_1080_url: "",
          mp4_2160_url: "",
        },
      },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      message: "Video queued for processing",
      video: videoDoc,
    });
  } catch (err: any) {
    console.error("Video commit error:", { requestId, err });
    return res.status(500).json({ message: "Failed to commit video", error: err.message });
  }
});


// GET /api/videos (Admin)
app.get("/api/videos", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const videos = await VideoModel.find({ status: { $ne: "archived" } })
      .sort({ createdAt: -1 })
      .select(
        "_id videoId title artist video_is_premium make_4k master_mp4_path poster_url mp4_720_url mp4_1080_url mp4_2160_url status processing_started_at createdAt updatedAt"
      )
      .lean();

    return res.json({ videos });
  } catch (err: any) {
    console.error("List videos error:", err);
    return res.status(500).json({ message: "Failed to list videos", error: err.message });
  }
});

// POST /api/videos/:videoId/retry (Admin)
app.post("/api/videos/:videoId/retry", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const updated = await VideoModel.findOneAndUpdate(
      { videoId },
      {
        $set: {
          status: "processing",
          processing_lock: "",
          processing_started_at: null,
        },
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Video not found" });
    return res.json({ message: "Video queued for processing", video: updated });
  } catch (err: any) {
    console.error("Retry video error:", err);
    return res.status(500).json({ message: "Failed to retry video", error: err.message });
  }
});

app.get("/api/videos/playback/:videoId", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
    }

    const { videoId } = req.params;
    const video = await VideoModel.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const qualities: Array<{ q: "720p" | "1080p" | "4k"; url: string }> = [];

    // Use public URL if you set R2_PUBLIC_DOMAIN, otherwise signed GET
    async function getUrlForKey(key: string) {
      if (!key) return "";
      if (R2_PUBLIC_DOMAIN) return publicUrlForKey(key);
      const cmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: key });
      return await getSignedUrl(r2!, cmd, { expiresIn: 60 * 30 }); // 30 minutes
    }

    const url720 = await getUrlForKey((video as any).mp4_720_path);
    const url1080 = await getUrlForKey((video as any).mp4_1080_path);
    const url2160 = await getUrlForKey((video as any).mp4_2160_path);

    if (url720) qualities.push({ q: "720p", url: url720 });
    if (url1080) qualities.push({ q: "1080p", url: url1080 });
    if (url2160) qualities.push({ q: "4k", url: url2160 });

    const posterUrl = (video as any).poster_path ? await getUrlForKey((video as any).poster_path) : "";

    return res.json({
      kind: "mp4",
      posterUrl,
      qualities,
      video: {
        id: (video as any)._id,
        title: (video as any).title,
        artist: (video as any).artist,
        video_is_premium: (video as any).video_is_premium,
        status: (video as any).status,
      },
    });
  } catch (err: any) {
    console.error("Video playback error:", err);
    return res.status(500).json({ message: "Failed to get playback", error: err.message });
  }
});

/**
 * =========================
 * POSTS ROUTES (your existing)
 * =========================
 */
app.get("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  let Model: any;
  switch (type) {
    case "web-development":
      Model = WebDevelopmentPostModel;
      break;
    case "app-development":
      Model = AppDevelopmentPostModel;
      break;
    case "graphic-design":
      Model = GraphicDesignPostModel;
      break;
    case "about":
      Model = AboutPostModel;
      break;
    case "portfolio":
      Model = PortfolioPostModel;
      break;
    case "web3":
      Model = Web3PostModel;
      break;
    case "projects":
      Model = ProjectsPostModel;
      break;
    case "services":
      Model = ServicesPostModel;
      break;
    case "pricing":
      Model = PricingPostModel;
      break;
    default:
      return res.status(400).json({ message: `Invalid type: ${type}posts` });
  }

  try {
    const post = await Model.findOne();
    if (post) return res.json(post);
    return res.status(404).json({ message: `${type}posts not found` });
  } catch (error: any) {
    return res.status(500).json({ message: `Error fetching ${type}posts`, error: error.message });
  }
});

app.put("/api/:typeposts", requireAdmin, async (req, res) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  let Model: any;
  switch (type) {
    case "web-development":
      Model = WebDevelopmentPostModel;
      break;
    case "app-development":
      Model = AppDevelopmentPostModel;
      break;
    case "graphic-design":
      Model = GraphicDesignPostModel;
      break;
    case "about":
      Model = AboutPostModel;
      break;
    case "portfolio":
      Model = PortfolioPostModel;
      break;
    case "web3":
      Model = Web3PostModel;
      break;
    case "projects":
      Model = ProjectsPostModel;
      break;
    case "services":
      Model = ServicesPostModel;
      break;
    case "pricing":
      Model = PricingPostModel;
      break;
    default:
      return res.status(400).json({ message: `Invalid type: ${type}posts` });
  }

  try {
    const postData = req.body;
    const existingPost = await Model.findOne();
    if (existingPost) {
      await Model.updateOne({}, postData);
      return res.json({ message: `${type}posts updated`, data: postData });
    } else {
      const newPost = new Model(postData);
      await newPost.save();
      return res.status(201).json({ message: `${type}posts created`, data: newPost });
    }
  } catch (error: any) {
    return res.status(500).json({ message: `Error saving ${type}posts`, error: error.message });
  }
});

/**
 * ✅ Serve Vite frontend static files (LAST)
 */
const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  return res.sendFile(path.join(distPath, "index.html"));
});

/**
 * ✅ Start server
 */
async function startServer() {
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

startServer()
  .then(() => {
    ViteExpress.listen(app, port, () => {
      console.log(`✅ Server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

ViteExpress.config({
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
});