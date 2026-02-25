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
import { execSync } from "child_process"
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { clerkClient } from "@clerk/clerk-sdk-node";
import { ClerkPublicMetadata } from "shared/clerk-types.js";

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
 * ✅ MongoDB URI (DO NOT LOG SECRETS)
 */
const rawUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/brightLightsCreative";
const uri = rawUri.startsWith("MONGODB_URI=")
  ? rawUri.replace("MONGODB_URI=", "")
  : rawUri;

/**
 * ✅ Encryption key (keep if you use it elsewhere)
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
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const claims = await clerkClient.verifyToken(token);
    const userId = (claims as any).sub;
    if (!userId) return res.status(401).json({ message: "Invalid token" });

    const user = await clerkClient.users.getUser(userId);
    const role = (user.publicMetadata as any)?.role;

    if (role !== "Admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    (req as any).user = claims;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(401).json({ message: "Invalid token" });
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

// Body parsing
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

/**
 * ✅ Multer memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (albums add up)
});

/**
 * ✅ Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "unknown" });
});

/**
 * =========================
 * LESSONS
 * =========================
 */

// GET /api/lessons/:topic/:order (public read)
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

// POST /api/lessons (admin write)
app.post("/api/lessons", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { topic, title, scripture, reflection, action_item, prayer } = req.body;

    if (!dailyTopics.includes(topic)) {
      return res.status(400).json({ message: `Invalid topic: ${topic}` });
    }

    let nextOrder = 1;
    const lastLesson = await LessonsModel.findOne({ topic })
      .sort({ order: -1 })
      .select("order")
      .exec();

    if (lastLesson && typeof lastLesson.order === "number") {
      nextOrder = lastLesson.order + 1;
    }

    if (!topic || !title || !scripture || !reflection || !action_item || !prayer) {
      return res.status(400).json({
        message: "Missing required fields",
        receivedKeys: Object.keys(req.body),
      });
    }

    if (typeof scripture !== "string" || scripture.length < 100) {
      return res.status(400).json({
        message: "Scripture must be a string with at least 100 characters",
        length: scripture?.length ?? "undefined",
      });
    }

    const lesson = new LessonsModel({
      topic,
      title,
      scripture,
      order: nextOrder,
      reflection,
      action_item,
      prayer,
    });

    await lesson.save();

    return res.status(201).json({
      message: "Lesson saved successfully",
      lesson: lesson.toObject(),
    });
  } catch (error: any) {
    console.error("Error saving lesson:", error);
    return res.status(500).json({
      message: "Error saving lesson",
      error: error.message || "Unknown server error",
    });
  }
});

/**
 * =========================
 * MUSIC (Admin CMS)
 * =========================
 */




app.get("/api/debug/ffmpeg", (req: Request, res: Response) => {
  try {
    const output = execSync("ffmpeg -version", { stdio: "pipe" }).toString();
    res.json({
      ok: true,
      version: output.split("\n")[0],
    });
  } catch (error: any) {
    res.status(500).json({
      ok: false,
      message: "ffmpeg not found at runtime",
      error: error?.message,
    });
  }
});
function safeJson<T>(value: any): T | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function sanitizeName(name: string) {
  return name.replace(/[^\w.\-]/g, "_");
}

function makeUploadId() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * POST /api/albums (Admin)
 * - cover (required)
 * - tracks (required, multiple)
 *
 * Current implementation:
 * - stores tracks as MP3 streaming assets (stream_mp3_path/url)
 * - leaves stream_m4a_* empty
 * - leaves master_wav_path empty (until you add a WAV master upload flow)
 */
app.post(
  "/api/albums",
  requireAdmin,
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "tracks", maxCount: 50 },
  ]),
  async (req: Request, res: Response) => {
    const requestId = makeUploadId();

    try {
      if (!isR2Configured()) {
        return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const coverFile = files?.cover?.[0];
      const trackFiles = files?.tracks || [];

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
        });
      }

      const parsedTitles = safeJson<string[]>(track_titles);
      const parsedNumbers = safeJson<number[]>(track_numbers);
      const parsedPremiumOverrides = safeJson<(boolean | null | undefined)[]>(track_is_premium);

      // 1) Upload cover
      const coverKey = `covers/${Date.now()}_${sanitizeName(coverFile.originalname)}`;
      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: coverKey,
          Body: coverFile.buffer,
          ContentType: coverFile.mimetype || "image/jpeg",
        })
      );

      const coverUrl = R2_PUBLIC_DOMAIN
        ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${coverKey}`
        : "";

      // 2) Create/reuse album doc
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

      // 3) Upload tracks + create track docs
      const createdTracks: any[] = [];

      const sortedTrackFiles = [...trackFiles].sort((a, b) =>
        a.originalname.localeCompare(b.originalname)
      );

      for (let i = 0; i < sortedTrackFiles.length; i++) {
        const f = sortedTrackFiles[i];

        // Basic “idiot proof” guard: if you upload the same album twice fast,
        // keys won't collide, but you might create duplicate tracks.
        // Your unique index (albumId+track_number) will block exact duplicates.
        const safeAudioName = sanitizeName(f.originalname);
        const mp3Key = `audio/mp3/${Date.now()}_${i + 1}_${safeAudioName}`;

        await r2!.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME!,
            Key: mp3Key,
            Body: f.buffer,
            ContentType: f.mimetype || "audio/mpeg",
          })
        );

        const mp3Url = R2_PUBLIC_DOMAIN
          ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${mp3Key}`
          : "";

        const title = parsedTitles?.[i] || f.originalname.replace(/\.[^/.]+$/, "");
        const trackNumber = parsedNumbers?.[i] ?? i + 1;
        const overridePremium = parsedPremiumOverrides?.[i];

        const trackDoc = new MusicTrackModel({
          albumId: albumDoc._id,
          title: String(title),
          track_number: Number(trackNumber),
          track_is_premium: typeof overridePremium === "boolean" ? overridePremium : undefined,

          // NEW SCHEMA FIELDS:
          stream_mp3_url: mp3Url,
          stream_mp3_path: mp3Key,
          stream_m4a_url: "",
          stream_m4a_path: "",
          master_wav_path: "",

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
    }
  }
);

// GET /api/albums (Admin)
app.get("/api/albums", requireAdmin, async (req: Request, res: Response) => {
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

      const album = await MusicAlbumModel.findById(albumId);
      if (!album) return res.status(404).json({ message: "Album not found" });

      const mp3Key = `audio/mp3/${Date.now()}_${sanitizeName(audioFile.originalname)}`;

      await r2!.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME!,
          Key: mp3Key,
          Body: audioFile.buffer,
          ContentType: audioFile.mimetype || "audio/mpeg",
        })
      );

      const mp3Url = R2_PUBLIC_DOMAIN
        ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${mp3Key}`
        : "";

      const track = new MusicTrackModel({
        albumId: album._id,
        title: String(title).trim(),
        track_number: parseInt(track_number, 10),

        track_is_premium:
          track_is_premium === undefined
            ? undefined
            : track_is_premium === "true" || track_is_premium === true,

        stream_mp3_url: mp3Url,
        stream_mp3_path: mp3Key,
        stream_m4a_url: "",
        stream_m4a_path: "",
        master_wav_path: "",

        status: "active",
      });

      await track.save();

      return res.status(201).json({ message: "Track added successfully", track });
    } catch (err: any) {
      console.error("Add track error:", err);
      if (err?.code === 11000) {
        return res.status(409).json({
          message: "Track number already exists for this album.",
          error: err.message,
        });
      }
      return res.status(500).json({ message: "Failed to add track", error: err.message });
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

    // Prefer MP3 stream for now
    const key = (track as any).stream_mp3_path;
    if (!key) return res.status(400).json({ message: "Track has no stream_mp3_path yet." });

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2!, command, { expiresIn: 3600 });
    return res.json({ signedUrl });
  } catch (err: any) {
    console.error("Signed URL error:", err);
    return res.status(500).json({ message: "Failed to generate URL", error: err.message });
  }
});

/**
 * =========================
 * POSTS ROUTES (unchanged)
 * =========================
 */
app.get("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  let Model;
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
  let Model;
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