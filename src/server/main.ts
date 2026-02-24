import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import encryptionKey from "./generateKey.js";
import { fileURLToPath } from "url";

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { clerkClient } from "@clerk/clerk-sdk-node";
import { ClerkPublicMetadata } from "shared/clerk-types.js";

// Import your models
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

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || encryptionKey;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be set in .env and be 32 characters long");
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
 * ✅ Cloudflare R2 env vars (fail-fast on music endpoints)
 */
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const R2_PUBLIC_DOMAIN = process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN;

/**
 * ✅ Cloudflare R2 S3 Client (SigV4 via AWS SDK)
 * (We still construct it, but endpoints will check config before using.)
 */
const r2 = new S3Client({
  region: "auto",
  endpoint: R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials:
    R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
      ? {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        }
      : undefined,
});

/**
 * ✅ Auth middleware (Admin-only)
 */
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const claims = await clerkClient.verifyToken(token);
    const metadata = claims.publicMetadata as ClerkPublicMetadata | undefined;

    if (metadata?.role !== "Admin") {
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
 * ✅ Multer memory storage so file.buffer exists
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/**
 * ✅ Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || "unknown" });
});

/**
 * =========================
 * LESSONS ROUTES
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
    return res
      .status(404)
      .json({ message: `Lesson not found for ${topic} order ${order}` });
  } catch (error: any) {
    console.error(`Error fetching lesson ${topic}/${order}: ${error.message}`);
    return res
      .status(500)
      .json({ message: "Error fetching lesson", error: error.message });
  }
});

// POST /api/lessons (Admin write)
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
 * MUSIC ROUTES (Admin CMS)
 * =========================
 */

app.post(
  "/api/music",
  requireAdmin,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    try {
      if (!R2_BUCKET_NAME || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { title, artist = "Great Light", album, track_number, is_premium = "true" } =
        req.body;

      if (!title || !album || !track_number || !files?.audio?.[0]) {
        return res.status(400).json({ message: "Missing required fields or audio file" });
      }

      const audioFile = files.audio[0];
      const safeAudioName = audioFile.originalname.replace(/[^\w.\-]/g, "_");
      const audioKey = `audio/${Date.now()}_${safeAudioName}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: audioKey,
          Body: audioFile.buffer,
          ContentType: audioFile.mimetype || "audio/mpeg",
        })
      );

      let coverUrl = "";
      let coverKey = "";

      if (files.cover?.[0]) {
        const coverFile = files.cover[0];
        const safeCoverName = coverFile.originalname.replace(/[^\w.\-]/g, "_");
        coverKey = `covers/${Date.now()}_${safeCoverName}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: coverKey,
            Body: coverFile.buffer,
            ContentType: coverFile.mimetype || "image/jpeg",
          })
        );

        coverUrl =
          R2_PUBLIC_DOMAIN
            ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${coverKey}`
            : "";
      }

      const audioUrl =
        R2_PUBLIC_DOMAIN
          ? `https://${R2_BUCKET_NAME}.${R2_PUBLIC_DOMAIN}/${audioKey}`
          : "";

      const track = new MusicTrackModel({
        title,
        artist,
        album,
        track_number: parseInt(track_number, 10),
        is_premium: is_premium === "true" || is_premium === true,
        cover_url: coverUrl,
        audio_url: audioUrl,
        bunny_path: audioKey,
      });

      await track.save();

      return res.status(201).json({ message: "Track saved successfully", track });
    } catch (err: any) {
      console.error("Music upload error:", err);
      return res.status(500).json({ message: "Failed to save track", error: err.message });
    }
  }
);

/**
 * GET /api/music/signed-url/:trackId
 * ✅ Admin-only for now (prevents public access).
 * Later you’ll create /api/app/music/signed-url/:trackId that checks Apple/Google entitlements.
 */
app.get(
  "/api/music/signed-url/:trackId",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      if (!R2_BUCKET_NAME || !R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
        return res.status(500).json({ message: "Cloudflare R2 is not configured on the server." });
      }

      const trackId = req.params.trackId;
      const track = await MusicTrackModel.findById(trackId);
      if (!track) return res.status(404).json({ message: "Track not found" });

      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: track.bunny_path,
      });

      // Shorter TTL is safer while you test
      const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour
      return res.json({ signedUrl });
    } catch (err: any) {
      console.error("Signed URL error:", err);
      return res.status(500).json({ message: "Failed to generate URL", error: err.message });
    }
  }
);

/**
 * =========================
 * POSTS ROUTES
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

/**
 * ✅ SPA catch-all: DO NOT swallow /api/*
 */
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