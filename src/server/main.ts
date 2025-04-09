import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import ViteExpress from "vite-express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import encryptionKey from "./generateKey.js";
import crypto from "node:crypto";
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
} from "../shared/interfaces.js";

dotenv.config();

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/brightLightsCreative";
console.log("Using MONGODB_URI:", uri);
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || encryptionKey;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be set in .env and be 32 characters long");
}

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("Middleware Error:", err);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

// API GET routes
app.get("/api/:typeposts", async (req: Request, res: Response) => {
  const type = req.params.typeposts.replace(/posts$/, "");
  console.log(`GET /api/${type}posts requested`);
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
    const post = await Model.findOne();
    if (post) {
      console.log(`Returning data for ${type}posts:`, post);
      res.json(post);
    } else {
      console.log(`${type}posts not found`);
      res.status(404).send({ message: `${type}posts not found` });
    }
  } catch (error) {
    console.error(`Error fetching ${type}posts:`, error);
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