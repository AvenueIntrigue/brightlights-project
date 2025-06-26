import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import path from "path";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import encryptionKey from "./generateKey.js";
import crypto from "node:crypto";

import cors from "cors";


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
  LessonsModel
} from "../shared/interfaces.js";

dotenv.config();

const rawUri = process.env.MONGODB_URI || "mongodb://localhost:27017/brightLightsCreative";
const uri = rawUri.startsWith("MONGODB_URI=") ? rawUri.replace("MONGODB_URI=", "") : rawUri;
console.log("Using MONGODB_URI:", uri);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || encryptionKey;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be set in .env and be 32 characters long");
}

const app = express();

// Configure CORS to allow requests from www.brightlightscreative.com
app.use(
  cors({
    origin: 'https://www.brightlightscreative.com', // Allow frontend origin
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'], // Allow necessary methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers used by axios
    credentials: true, // Support cookies or auth headers (optional)
  })
);

// Handle preflight requests for all routes
app.options('*', cors());

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Middleware Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});


app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Middleware Error:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});



// Serve robots.txt for /public/robots.txt
app.get("/public/robots.txt", (req, res) => {
  res.sendFile(path.resolve("public/robots.txt"));
});

// API GET routes
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
    default: return res.status(400).send({ message: `Invalid type: ${type}posts` });
  }
  try {
    const post = await Model.findOne();
    console.log(`Result for ${type}posts:`, post ? "Found" : "Not found");
    if (post) res.json(post);
    else res.status(404).send({ message: `${type}posts not found` });
  } catch (error) {
    res.status(500).send({ message: `Error fetching ${type}posts`, error });
  }
});

// API PUT routes
app.put("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  console.log(`PUT /api/${type}posts requested with data:`, req.body);
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
      return res.status(400).send({ message: `Invalid type: ${type}posts` });
  }
  try {
    const postData = req.body;
    const existingPost = await Model.findOne();
    if (existingPost) {
      await Model.updateOne({}, postData);
      console.log(`Updated ${type}posts:`, postData);
      res.json({ message: `${type}posts updated`, data: postData });
    } else {
      const newPost = new Model(postData);
      await newPost.save();
      console.log(`Created ${type}posts:`, newPost);
      res.status(201).json({ message: `${type}posts created`, data: newPost });
    }
  } catch (error) {
    console.error(`Error saving ${type}posts:`, error);
    res.status(500).send({ message: `Error saving ${type}posts`, error });
  }
});



// Lesson routes
app.get('/api/lessons/:fruit/:order', async (req: Request, res: Response) => {
  const { fruit, order } = req.params;
  const fruitsOfTheSpirit = [
    'love',
    'joy',
    'peace',
    'patience',
    'kindness',
    'goodness',
    'faithfulness',
    'gentleness',
    'self-control',
  ];
  if (!fruitsOfTheSpirit.includes(fruit)) {
    return res.status(400).json({ message: `Invalid fruit: ${fruit}` });
  }
  const orderNum = parseInt(order, 10);
  if (isNaN(orderNum) || orderNum < 1) {
    return res.status(400).json({ message: `Invalid order: ${order}` });
  }
  try {
    const lesson = await LessonsModel.findOne({ fruit, order: orderNum });
    if (lesson) {
      res.json(lesson);
    } else {
      res.status(404).json({ message: `Lesson not found for ${fruit} order ${order}` });
    }
  } catch (error) {
    console.error(`Error fetching lesson ${fruit}/${order}:`, error);
    res.status(500).json({ message: 'Error fetching lesson', error });
  }
});

app.post('/api/lessons', async (req: Request, res: Response) => {
  const fruitsOfTheSpirit = [
    'love',
    'joy',
    'peace',
    'patience',
    'kindness',
    'goodness',
    'faithfulness',
    'gentleness',
    'self-control',
  ];
  const { fruit, order, book, chapter, verses, prayer, quiz } = req.body;
  if (!fruitsOfTheSpirit.includes(fruit)) {
    return res.status(400).json({ message: `Invalid fruit: ${fruit}` });
  }
  if (!Number.isInteger(order) || order < 1) {
    return res.status(400).json({ message: `Invalid order: ${order}` });
  }
  if (!book || !chapter || !verses || !prayer || !quiz || !quiz.question || !quiz.options || quiz.options.length < 3 || !Number.isInteger(quiz.correctAnswer)) {
    return res.status(400).json({ message: 'Missing or invalid required fields' });
  }
  try {
    const lesson = new LessonsModel(req.body);
    await lesson.save();
    console.log(`Created lesson: ${fruit}/${order}`);
    res.status(201).json(lesson);
  } catch (error) {
    console.error('Error saving lesson:', error);
    res.status(500).json({ message: 'Error saving lesson', error });
  }
});

async function startServer() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

// Use Render's PORT or fallback to 3000 for local dev
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