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

/**
 * Presign and commit endpoints for client direct-to-R2 uploads (optional).
 */
app.post("/api/r2/presign", requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
    }

    const { kind, albumTitle, artist, trackNumber, filename, contentType } = req.body as {
      kind: "cover" | "master";
      albumTitle?: string;
      artist?: string;
      trackNumber?: number;
      filename: string;
      contentType?: string;
    };

    if (!kind || !filename) {
      return res.status(400).json({ message: "Missing required fields: kind, filename" });
    }

    const safeFile = sanitizeName(filename);
    const safeArtist = sanitizeName((artist || "Great_Light").trim());
    const safeAlbum = sanitizeName((albumTitle || "Untitled_Album").trim());

    const key =
      kind === "cover"
        ? `covers/${safeArtist}/${safeAlbum}/${Date.now()}_${safeFile}`
        : `audio/master/${safeArtist}/${safeAlbum}/track_${String(trackNumber ?? 0).padStart(
            2,
            "0"
          )}_${Date.now()}_${safeFile}`;

    const cmd = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType || (kind === "cover" ? "image/jpeg" : "audio/wav"),
    });

    const putUrl = await getSignedUrl(r2!, cmd, { expiresIn: 60 * 10 });
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

    for (const t of tracks) {
      const trackDoc = new MusicTrackModel({
        albumId: albumDoc._id,
        title: String(t.title).trim(),
        track_number: Number(t.track_number),
        track_is_premium: typeof t.track_is_premium === "boolean" ? t.track_is_premium : undefined,

        master_wav_path: t.master_wav_key,

        // if your schema allows empty defaults, this is fine:
        stream_mp3_url: "",
        stream_mp3_path: t.stream_mp3_key || "",
        stream_m4a_url: "",
        stream_m4a_path: t.stream_m4a_key || "",

        status: "active",
      });

      await trackDoc.save();
      createdTracks.push(trackDoc);
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