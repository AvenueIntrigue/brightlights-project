import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import encryptionKey from "./generateKey.js";
import crypto from "node:crypto";
import { fileURLToPath } from 'url';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { ClerkPublicMetadata } from "shared/clerk-types.js";



// ESM-safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  MusicTrackModel, // Added
} from "../shared/interfaces.js";

// Load environment variables
dotenv.config();

const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017/brightLightsCreative";
const uri = rawUri.startsWith("MONGODB_URI=") ? rawUri.replace("MONGODB_URI=", "") : rawUri;
console.log("Using MONGODB_URI:", uri);

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || encryptionKey;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be set in .env and be 32 characters long");
}

const app = express();



// R2 client setup (add once)
const r2 = new S3Client({
  region: 'auto', // Cloudflare R2 special value
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});



// Middleware to protect /api/music
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const claims = await clerkClient.verifyToken(token);

    // Cast publicMetadata to your custom type so TypeScript knows about 'role'
    const metadata = claims.publicMetadata as ClerkPublicMetadata | undefined;

    // Check role (case-sensitive match to 'Admin')
    if (metadata?.role !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Attach claims to req (use type assertion to silence TS error)
    (req as any).user = claims;

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};



// === CORS & Preflight Handling FIRST ===
app.use(cors({
  origin: [
    "https://www.brightlightscreative.com",
    "https://brightlightscreative.com",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options("*", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

// Prevent redirects for API/OPTIONS
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "OPTIONS" || req.path.startsWith("/api/")) {
    return next();
  }
  next();
});

// Middleware
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Multer for file uploads (temp storage before Bunny)
const upload = multer({ dest: 'uploads/' }); // temp folder — clean up after upload if needed

// === LESSONS ROUTES (unchanged) ===

// GET /api/lessons/:topic/:order
app.get("/api/lessons/:topic/:order", async (req: Request, res: Response) => {
  const { topic, order } = req.params;
  if (!topic.includes(topic as any)) {
    return res.status(400).json({ message: `Invalid topic: ${topic}` });
  }
  const orderNum = parseInt(order, 10);
  if (isNaN(orderNum) || orderNum < 1) {
    return res.status(400).json({ message: `Invalid order: ${order}` });
  }
  try {
    const lesson = await LessonsModel.findOne({ topic, order: orderNum });
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ message: `Lesson not found for ${topic} order ${order}` });
    }
  } catch (error: any) {
    console.error(`Error fetching lesson ${topic}/${order}: ${error.message}`);
    res.status(500).json({ message: "Error fetching lesson", error: error.message });
  }
});

// POST /api/lessons (Auto-assign order)
app.post("/api/lessons", async (req: Request, res: Response) => {
  try {
    const {
      topic,
      title,
      scripture,
      reflection,
      action_item,
      prayer,
    } = req.body;

    console.log("POST /api/lessons received - Body:", JSON.stringify(req.body, null, 2));

    if (!topic.includes(topic as any)) {
      return res.status(400).json({ message: `Invalid topic: ${topic}` });
    }

    let nextOrder = 1;
    try {
      const lastLesson = await LessonsModel.findOne({ topic })
        .sort({ order: -1 })
        .select('order')
        .exec();
      if (lastLesson && typeof lastLesson.order === 'number') {
        nextOrder = lastLesson.order + 1;
      }
      console.log(`Assigned order ${nextOrder} for topic "${topic}"`);
    } catch (queryError: any) {
      console.error("Error querying last lesson for topic:", queryError.message);
    }

    if (!topic || !title || !scripture || !reflection || !action_item || !prayer) {
      return res.status(400).json({
        message: "Missing required fields",
        receivedKeys: Object.keys(req.body)
      });
    }

    if (typeof scripture !== 'string' || scripture.length < 100) {
      return res.status(400).json({
        message: "Scripture must be a string with at least 100 characters",
        length: scripture?.length ?? "undefined"
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

    console.log(`Lesson saved successfully: ${topic}/${nextOrder}`);

    res.status(201).json({
      message: "Lesson saved successfully",
      lesson: lesson.toObject(),
    });
  } catch (error: any) {
    console.error("Error saving lesson:");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, null, 2));
    res.status(500).json({
      message: "Error saving lesson",
      error: error.message || "Unknown server error",
      details: error.name === 'ValidationError' ? error.errors : null,
    });
  }
});

// === NEW: POST /api/music ===
// POST /api/music
app.post('/api/music', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const {
      title,
      artist = 'Great Light',
      album,
      track_number,
      is_premium = 'true',
    } = req.body;

    // Validation
    if (!title || !album || !track_number || !files.audio?.[0]) {
      return res.status(400).json({ message: 'Missing required fields or audio file' });
    }

    // 1. Upload audio to Cloudflare R2
    const audioFile = files.audio[0];
    const audioKey = `audio/${audioFile.originalname}`;

    const audioResponse = await fetch(
      `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_R2_BUCKET_NAME}/${audioKey}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}`,
          'Content-Type': 'audio/mpeg', // or 'audio/mp4' for M4A
          'x-amz-acl': 'private',
        },
        body: new Blob([new Uint8Array(audioFile.buffer)]),
      }
    );

    if (!audioResponse.ok) {
      throw new Error(`R2 audio upload failed: ${audioResponse.statusText}`);
    }

    const audioUrl = `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${audioKey}`;

    // 2. Upload cover (optional)
    let coverUrl = '';
    if (files.cover?.[0]) {
      const coverFile = files.cover[0];
      const coverKey = `covers/${coverFile.originalname}`;

      const coverResponse = await fetch(
        `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_R2_BUCKET_NAME}/${coverKey}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY}`,
            'Content-Type': 'image/jpeg',
            'x-amz-acl': 'private',
          },
          body: new Blob([new Uint8Array(coverFile.buffer)]),
        }
      );

      if (!coverResponse.ok) {
        throw new Error(`R2 cover upload failed: ${coverResponse.statusText}`);
      }

      coverUrl = `https://${process.env.CLOUDFLARE_R2_BUCKET_NAME}.${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${coverKey}`;
    }

    // 3. Create and save the track object
    const track = new MusicTrackModel({
      title,
      artist,
      album,
      track_number: parseInt(track_number),
      is_premium: is_premium === 'true' || is_premium === true,
      cover_url: coverUrl,
      audio_url: audioUrl,
      bunny_path: audioKey, // rename to r2_key if you prefer
    });

    await track.save();

    res.status(201).json({
      message: 'Track saved successfully',
      track,  // now 'track' is defined
    });
  } catch (err: any) {
    console.error('Music upload error:', err);
    res.status(500).json({
      message: 'Failed to save track',
      error: err.message,
    });
  }
});

// GET /api/music/signed-url/:trackId
app.get('/api/music/signed-url/:trackId', async (req: Request, res: Response) => {
  try {
    const trackId = req.params.trackId;

    // Fetch the track from MongoDB (no auth/premium check here)
    const track = await MusicTrackModel.findById(trackId);
    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Generate signed URL (valid for 24 hours - adjust expiresIn as needed)
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: track.bunny_path, // e.g., "audio/in-that-day.mp3"
    });

    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 86400 }); // 24 hours

    res.json({ signedUrl });
  } catch (err: any) {
    console.error('Signed URL error:', err);
    res.status(500).json({ message: 'Failed to generate URL', error: err.message });
  }
});

// Legacy GET /api/:typeposts (unchanged)
app.get("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  let Model;
  switch (type) {
    case "web-development": Model = WebDevelopmentPostModel; break;
    case "app-development": Model = AppDevelopmentPostModel; break;
    case "graphic-design": Model = GraphicDesignPostModel; break;
    case "about": Model = AboutPostModel; break;
    case "portfolio": Model = PortfolioPostModel; break;
    case "web3": Model = Web3PostModel; break;
    case "projects": Model = ProjectsPostModel; break;
    case "services": Model = ServicesPostModel; break;
    case "pricing": Model = PricingPostModel; break;
    default: return res.status(400).json({ message: `Invalid type: ${type}posts` });
  }
  try {
    const post = await Model.findOne();
    if (post) res.json(post);
    else res.status(404).json({ message: `${type}posts not found` });
  } catch (error: any) {
    res.status(500).json({ message: `Error fetching ${type}posts`, error: error.message });
  }
});

// Legacy PUT /api/:typeposts (unchanged)
app.put("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  let Model;
  switch (type) {
    case "web-development": Model = WebDevelopmentPostModel; break;
    case "app-development": Model = AppDevelopmentPostModel; break;
    case "graphic-design": Model = GraphicDesignPostModel; break;
    case "about": Model = AboutPostModel; break;
    case "portfolio": Model = PortfolioPostModel; break;
    case "web3": Model = Web3PostModel; break;
    case "projects": Model = ProjectsPostModel; break;
    case "services": Model = ServicesPostModel; break;
    case "pricing": Model = PricingPostModel; break;
    default: return res.status(400).json({ message: `Invalid type: ${type}posts` });
  }
  try {
    const postData = req.body;
    const existingPost = await Model.findOne();
    if (existingPost) {
      await Model.updateOne({}, postData);
      res.json({ message: `${type}posts updated`, data: postData });
    } else {
      const newPost = new Model(postData);
      await newPost.save();
      res.status(201).json({ message: `${type}posts created`, data: newPost });
    }
  } catch (error: any) {
    res.status(500).json({ message: `Error saving ${type}posts`, error: error.message });
  }
});

// === IMPORTANT: Serve Vite frontend static files and SPA routing (LAST!) ===
const distPath = path.join(__dirname, '../../dist');
console.log(`Serving static files from: ${distPath}`);
app.use(express.static(distPath));

// Catch-all route for React Router (SPA) - serves index.html for all non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log(`Serving index.html from: ${indexPath}`);
  res.sendFile(indexPath);
});

// Start Server
async function startServer() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
startServer()
  .then(() => {
    ViteExpress.listen(app, port, () => {
      console.log("main.ts file started executing...");
      console.log(`✅ Server is listening on http://localhost:${port}`);
      console.log("Open this in your browser: http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
  });

// ViteExpress config
ViteExpress.config({
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
});