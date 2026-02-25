import mongoose, { Schema, Document } from "mongoose";

/**
 * =========================
 * Category
 * =========================
 */
export interface Category extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}
const CategorySchema: Schema = new Schema({
  name: { type: String, unique: true, required: true, trim: true },
});
const CategoryModel = mongoose.model<Category>("Category", CategorySchema);

/**
 * =========================
 * BlogPost
 * =========================
 */
export interface BlogPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; alt: string }[];
  category: string;
  keywords: string[];
  createdOn: Date;
}
const BlogPostSchema: Schema<BlogPost> = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },
      alt: { type: String, required: true },
    },
  ],
  category: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  keywords: { type: [String], required: false },
});
const BlogPostModel = mongoose.model<BlogPost>("BlogPost", BlogPostSchema);

/**
 * =========================
 * Container Content
 * =========================
 */
export interface TopContainerContent extends Document {
  _id: mongoose.Types.ObjectId;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}
const TopContainerContentSchema: Schema<TopContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  keywords: { type: [String], required: false },
});
const TopContainerContentModel = mongoose.model<TopContainerContent>(
  "topcontainercontents",
  TopContainerContentSchema
);

export interface MiddleContainerContent extends Document {
  _id: mongoose.Types.ObjectId;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}
const MiddleContainerContentSchema: Schema<MiddleContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  keywords: { type: [String], required: false },
});
const MiddleContainerContentModel = mongoose.model<MiddleContainerContent>(
  "middlecontainercontents",
  MiddleContainerContentSchema
);

export interface BulletContainerAboutUs extends Document {
  _id: mongoose.Types.ObjectId;
  aboutUs: string;
}
const BulletContainerAboutUsSchema: Schema<BulletContainerAboutUs> = new Schema({
  aboutUs: { type: String, required: true },
});
const BulletContainerAboutUsModel = mongoose.model<BulletContainerAboutUs>(
  "bulletcontaineraboutus",
  BulletContainerAboutUsSchema
);

export interface BulletContainerContent extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  keywords: string[];
}
const BulletContainerContentSchema: Schema<BulletContainerContent> = new Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  description: { type: String, required: true },
  keywords: { type: [String], required: true },
});
const BulletContainerContentModel = mongoose.model<BulletContainerContent>(
  "bulletcontainercontents",
  BulletContainerContentSchema
);

export interface web3ContainerContent extends Document {
  _id: mongoose.Types.ObjectId;
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}
const web3ContainerContentSchema: Schema<web3ContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  keywords: { type: [String], required: true },
});
const web3ContainerContentModel = mongoose.model<web3ContainerContent>(
  "web3containercontents",
  web3ContainerContentSchema
);

/**
 * =========================
 * Marketing Consent
 * =========================
 */
export interface marketingConsentContent extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  phone: string;
  acceptsEmailMarketing: boolean;
  acceptsTextMarketing: boolean;
  createdAt: Date;
}
const marketingConsentSchema: Schema<marketingConsentContent> = new Schema({
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  phone: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  acceptsEmailMarketing: { type: Boolean, default: false },
  acceptsTextMarketing: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const marketingConsentContentModel = mongoose.model<marketingConsentContent>(
  "marketingConsentContents",
  marketingConsentSchema
);

/**
 * =========================
 * Lessons
 * =========================
 */
export interface Lesson extends Document {
  topic: string;
  title: string;
  scripture: string;
  reflection: string;
  action_item: string;
  prayer: string;
  order: number;
  book?: string;
  chapter?: number;
  fruit?: string;
  quiz?: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
  };
}
const lessonSchema: Schema<Lesson> = new Schema(
  {
    topic: { type: String, required: true },
    title: { type: String, required: true },
    scripture: { type: String, required: true },
    reflection: { type: String, required: true },
    action_item: { type: String, required: true },
    prayer: { type: String, required: true },
    order: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

// Useful: speed up topic/order lookups
lessonSchema.index({ topic: 1, order: 1 }, { unique: true });

const LessonsModel = mongoose.model<Lesson>("Lesson", lessonSchema);

/**
 * =========================
 * Music Album + Track
 * =========================
 */
export type MusicStatus = "active" | "draft" | "archived";

/**
 * Album Schema (1 cover per album)
 */
export interface MusicAlbum extends Document {
  title: string;
  artist: string;
  album_is_premium: boolean;

  // Cover
  cover_url: string; // optional public URL if you choose
  cover_path: string; // R2 key (source of truth)

  status?: MusicStatus;
}

const musicAlbumSchema: Schema<MusicAlbum> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "Great Light", trim: true },
    album_is_premium: { type: Boolean, default: true },

    cover_url: { type: String, default: "" },
    cover_path: { type: String, default: "" }, // allow empty if you ever backfill old albums

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
  },
  { timestamps: true, collection: "musicalbums" }
);

// One album per artist+title
musicAlbumSchema.index({ title: 1, artist: 1 }, { unique: true });
// Admin list sorting
musicAlbumSchema.index({ status: 1, createdAt: -1 });

const MusicAlbumModel = mongoose.model<MusicAlbum>("MusicAlbum", musicAlbumSchema);

/**
 * Track Schema
 *
 * IMPORTANT:
 * - *_path fields are the truth (R2 object keys)
 * - *_url fields are optional (public URL if you use a public domain)
 * - For secure streaming, you’ll typically ignore *_url and return signed URLs from the server.
 */
export interface MusicTrack extends Document {
  albumId: mongoose.Types.ObjectId;

  title: string;
  track_number: number;
  duration_seconds?: number;

  // undefined => inherit album_is_premium
  track_is_premium?: boolean;

  // Streaming assets
  stream_mp3_url: string;
  stream_mp3_path: string;

  stream_m4a_url: string;
  stream_m4a_path: string;

  // Master asset (never stream)
  master_wav_path: string;

  status?: MusicStatus;
}

const musicTrackSchema: Schema<MusicTrack> = new Schema(
  {
    albumId: { type: Schema.Types.ObjectId, ref: "MusicAlbum", required: true },

    title: { type: String, required: true, trim: true },
    track_number: { type: Number, required: true, min: 1 },
    duration_seconds: Number,

    track_is_premium: { type: Boolean, required: false },

    stream_mp3_url: { type: String, default: "" },
    stream_mp3_path: { type: String, required: true },

    stream_m4a_url: { type: String, default: "" },
    stream_m4a_path: { type: String, required: true },

    master_wav_path: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
  },
  { timestamps: true, collection: "musictracks" }
);

// Prevent duplicate track numbers per album
musicTrackSchema.index({ albumId: 1, track_number: 1 }, { unique: true });
// Helpful for “list tracks for album in order”
musicTrackSchema.index({ albumId: 1, track_number: 1 });

const MusicTrackModel = mongoose.model<MusicTrack>("MusicTrack", musicTrackSchema);

/**
 * =========================
 * Generic Posts
 * =========================
 */
export interface Post extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; alt: string }[];
  pages: string;
  keywords: string[];
  createdOn: Date;
}

const PostSchema = new Schema<Post>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [
    {
      url: { type: String, required: true },
      alt: { type: String, required: true },
    },
  ],
  pages: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
  keywords: { type: [String], required: false },
});

// Post Models with Correct Collection Names
const PricingPostModel = mongoose.model<Post>("pricingposts", PostSchema);
const AboutPostModel = mongoose.model<Post>("aboutposts", PostSchema);
const WebDevelopmentPostModel = mongoose.model<Post>("web-developmentposts", PostSchema);
const AppDevelopmentPostModel = mongoose.model<Post>("app-developmentposts", PostSchema);
const GraphicDesignPostModel = mongoose.model<Post>("graphic-designposts", PostSchema);
const ServicesPostModel = mongoose.model<Post>("servicesposts", PostSchema);
const Web3PostModel = mongoose.model<Post>("web3posts", PostSchema);
const ProjectsPostModel = mongoose.model<Post>("projectsposts", PostSchema);
const PortfolioPostModel = mongoose.model<Post>("portfolioposts", PostSchema);

/**
 * =========================
 * Exports
 * =========================
 */
export {
  BlogPostModel,
  TopContainerContentModel,
  MiddleContainerContentModel,
  BulletContainerAboutUsModel,
  BulletContainerContentModel,
  web3ContainerContentModel,
  marketingConsentContentModel,
  PricingPostModel,
  AboutPostModel,
  WebDevelopmentPostModel,
  AppDevelopmentPostModel,
  GraphicDesignPostModel,
  ServicesPostModel,
  Web3PostModel,
  ProjectsPostModel,
  PortfolioPostModel,
  CategoryModel,
  LessonsModel,
  MusicAlbumModel,
  MusicTrackModel,
};