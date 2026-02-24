import mongoose, { Schema, Document } from "mongoose";

// Category
export interface Category extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}
const CategorySchema: Schema = new Schema({
  name: { type: String, unique: true, required: true, trim: true },
});
const CategoryModel = mongoose.model<Category>("Category", CategorySchema);

// BlogPost
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

// Container Content Interfaces
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
const BulletContainerAboutUsModel = mongoose.model<BulletContainerAboutUs>(
  "bulletcontaineraboutus",
  BulletContainerAboutUsSchema
);
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

// Lesson Schema
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
const LessonsModel = mongoose.model<Lesson>("Lesson", lessonSchema);

// =========================
// Music Album + Track Schema
// =========================

export type MusicStatus = "active" | "draft" | "archived";

// Album Schema (1 cover per album)
export interface MusicAlbum extends Document {
  title: string;
  artist: string;
  album_is_premium: boolean; // default premium state for tracks
  cover_url: string; // optional public URL (or empty if private)
  cover_path: string; // R2 key for cover (recommended)
  status?: MusicStatus;
}

const musicAlbumSchema: Schema<MusicAlbum> = new Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: "Great Light", trim: true },
    album_is_premium: { type: Boolean, default: true },

    cover_url: { type: String, default: "" },
    cover_path: { type: String, required: true, default: "" },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
  },
  { timestamps: true, collection: "musicalbums" }
);

// Helpful uniqueness: one artist+title album
musicAlbumSchema.index({ title: 1, artist: 1 }, { unique: true });
// Helpful listing index
musicAlbumSchema.index({ status: 1, createdAt: -1 });

const MusicAlbumModel = mongoose.model<MusicAlbum>("MusicAlbum", musicAlbumSchema);

// Track Schema
export interface MusicTrack extends Document {
  albumId: mongoose.Types.ObjectId; // reference to MusicAlbum

  title: string;
  track_number: number;
  duration_seconds?: number;

  // Override: if set, it overrides album_is_premium. If not set, inherit.
  track_is_premium?: boolean;

  audio_url: string; // optional public URL (or empty if private)
  bunny_path: string; // R2 key (rename later if desired)

  status?: MusicStatus;
}

const musicTrackSchema: Schema<MusicTrack> = new Schema(
  {
    albumId: { type: Schema.Types.ObjectId, ref: "MusicAlbum", required: true, index: true },

    title: { type: String, required: true, trim: true },
    track_number: { type: Number, required: true, min: 1 },
    duration_seconds: Number,

    // undefined means "inherit"
    track_is_premium: { type: Boolean, required: false },

    audio_url: { type: String, default: "" },
    bunny_path: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
  },
  { timestamps: true, collection: "musictracks" }
);

// Prevent duplicate track numbers within the same album
musicTrackSchema.index({ albumId: 1, track_number: 1 }, { unique: true });
// Helpful listing index
musicTrackSchema.index({ status: 1, createdAt: -1 });

const MusicTrackModel = mongoose.model<MusicTrack>("MusicTrack", musicTrackSchema);

// Post Interface (Generic for All Post Types)
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

// Exports
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
  MusicTrackModel,
  MusicAlbumModel,
};