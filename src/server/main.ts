import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import encryptionKey from "./generateKey.js";
import crypto from "node:crypto";

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

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Global Error Handler:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// Serve static files
app.get("/public/robots.txt", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public/robots.txt"));
});

// Valid topics
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
  "faith",
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

// GET /api/lessons/:topic/:order
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

// === POST /api/lessons (Auto-assign order) ===
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

    // Validate topic
    if (!dailyTopics.includes(topic as any)) {
      return res.status(400).json({ message: `Invalid topic: ${topic}` });
    }

    // Automatically assign next order
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
      // Fallback to 1 if query fails
    }

    // Validate required fields
    if (!topic || !title || !scripture || !reflection || !action_item || !prayer) {
      return res.status(400).json({ 
        message: "Missing required fields",
        receivedKeys: Object.keys(req.body)
      });
    }

    if (typeof scripture !== 'string' || scripture.length < 1000) {
      return res.status(400).json({ 
        message: "Scripture must be a string with at least 1000 characters",
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

// Legacy GET /api/:typeposts
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

// Legacy PUT /api/:typeposts
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
      console.log(`Server is listening on port ${port}...`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
  });

// ViteExpress config
ViteExpress.config({
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
});