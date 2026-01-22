import mongoose, { Schema, Document } from "mongoose";

// Category
export interface Category extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
}
const CategorySchema: Schema = new Schema({
  name: { type: String, unique: true, required: true },
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

// Lesson Schema (updated to match frontend data + make extra fields optional)
export interface Lesson extends Document {
  topic: string;          // renamed from fruit
  title: string;
  scripture: string;
  reflection: string;
  action_item: string;
  prayer: string;
  order: number;
  // Optional fields (not sent by frontend yet)
  book?: string;
  chapter?: number;
  fruit?: string;         // kept as optional if you still want it
  quiz?: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
  };
}

const lessonSchema: Schema<Lesson> = new Schema({
  topic: { type: String, required: true },
  title: { type: String, required: true },
  scripture: { type: String, required: true },
  reflection: { type: String, required: true },
  action_item: { type: String, required: true },
  prayer: { type: String, required: true },
  order: { type: Number, required: true, min: 1 },

}, { timestamps: true });

const LessonsModel = mongoose.model<Lesson>('Lesson', lessonSchema);

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
const WebDevelopmentPostModel = mongoose.model<Post>(
  "web-developmentposts",
  PostSchema
);
const AppDevelopmentPostModel = mongoose.model<Post>(
  "app-developmentposts",
  PostSchema
);
const GraphicDesignPostModel = mongoose.model<Post>(
  "graphic-designposts",
  PostSchema
);
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
  LessonsModel
};