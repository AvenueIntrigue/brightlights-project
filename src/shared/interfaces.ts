

// Existing interfaces and schemas
import mongoose, { Schema, Document, type Date as MongooseDate} from "mongoose";

const CategorySchema: Schema = new Schema({
  name: { type: String, unique: true, required: true }
});



const CategoryModel = mongoose.model('Category', CategorySchema);




export interface BlogPost extends Document {
  _id?: mongoose.Types.ObjectId; // MongoDB's default unique identifier
  title: string;
  description: string;
  images: {
    url: string;
    alt: string;
  }[];
  category: string;
  keywords: string[];
  createdOn: Date;
  
};

const BlogPostSchema: Schema<BlogPost> = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true }
  }],
  category: { 
    type: String, 
    required: true,
  },
  createdOn: { type: Date, default: Date.now },
  keywords: { type: [String], required: false}
});

const BlogPostModel = mongoose.model<BlogPost>('BlogPost', BlogPostSchema);

export interface TopContainerContent extends Document {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}

const TopContainerContentSchema: Schema<TopContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  title: { type: String, required: true},
  description: { type: String, required: true},
  keywords: { type: [String], required: false }

});

const TopContainerContentModel = mongoose.model<TopContainerContent>('topcontainercontents', TopContainerContentSchema);

export { TopContainerContentModel };

export interface MiddleContainerContent extends Document {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}

const MiddleContainerContentSchema: Schema<MiddleContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: { type: String, required: true },
  title: { type: String, required: true},
  description: { type: String, required: true},
  keywords: { type: [String], required: false }
});

const MiddleContainerContentModel = mongoose.model<MiddleContainerContent>('middlecontainercontents', MiddleContainerContentSchema);

export { MiddleContainerContentModel };
// shared/interfaces.ts



export interface BulletContainerAboutUs {
  aboutUs: string;
}

const BulletContainerAboutUsSchema: Schema<BulletContainerAboutUs> = new Schema({
  aboutUs: { type: String, required: true },
});

export interface BulletContainerContent {
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

const BulletContainerAboutUsModel = mongoose.model<BulletContainerAboutUs>('bulletcontaineraboutus', BulletContainerAboutUsSchema);
const BulletContainerContentModel = mongoose.model<BulletContainerContent>('bulletcontainercontents', BulletContainerContentSchema);




export interface web3ContainerContent extends Document {
  image: string;
  imageAlt: string;
  title: string;
  description: string;
  keywords: string[];
}

const web3ContainerContentSchema: Schema<web3ContainerContent> = new Schema({
  image: { type: String, required: true },
  imageAlt: {type: String, required: true},
  title: {type: String, required: true},
  description: { type: String, required: true },
  keywords: { type: [String], required: true}
});

const web3ContainerContentModel = mongoose.model<web3ContainerContent>('web3containercontents', web3ContainerContentSchema);

export { web3ContainerContentModel };


export interface marketingConsentContent extends Document {
  
  email: string;
  phone: string;
  acceptsEmailMarketing: boolean;
  acceptsTextMarketing: boolean;
  createdAt: Date;
}

const marketingConsentSchema: Schema<marketingConsentContent>= new Schema({
  email: {
    type: String,
    required: false,
    unique: true, // Prevent duplicate emails
    sparse: true, // Allow nulls while keeping uniqueness
  },
  phone: {
    type: String,
    required: false,
    unique: true, // Prevent duplicate phone numbers
    sparse: true,
  },
  acceptsEmailMarketing: {
    type: Boolean,
    default: false,
  },
  acceptsTextMarketing: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
});



const marketingConsentContentModel = mongoose.model<marketingConsentContent>('marketingConsentContents', marketingConsentSchema);

export {marketingConsentContentModel};



export interface PostSection {
  _id?: mongoose.Types.ObjectId; // MongoDB's default unique identifier
  title: string;
  description: string;
  images: {
    url: string;
    alt: string;
  }[];
  pages: string;
  keywords: string[];
  createdOn: Date;
  
};

export interface Post extends Document {
  _id?: mongoose.Types.ObjectId; // MongoDB's default unique identifier
  title: string;
  description: string;
  images: {
    url: string;
    alt: string;
  }[];
  pages: string;
  keywords: string[];
  createdOn: Date;
}

const PostSchema = new Schema<Post>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true }
  }],
  pages: { 
    type: String, 
    required: true,
  },
  createdOn: { type: Date, default: Date.now },
  keywords: { type: [String], required: false}
});

// Example for Pricing Post
const PricingPostModel = mongoose.model<Post>('PricingPost', PostSchema);
const AboutPostModel = mongoose.model<Post>('AboutPost', PostSchema);
const WebDevelopmentPostModel = mongoose.model<Post>('Web-DevelopmentPost', PostSchema);
const AppDevelopmentPostModel = mongoose.model<Post>('App-DevelopmentPost', PostSchema);
const GraphicDesignPostModel = mongoose.model<Post>('Graphic-DesignPost', PostSchema);
const ServicesPostModel = mongoose.model<Post>('ServicesPost', PostSchema);
const Web3PostModel = mongoose.model<Post>('Web3Post', PostSchema);
const ProjectsPostModel = mongoose.model<Post>('ProjectsPost', PostSchema);
const PortfolioPostModel = mongoose.model<Post>('PortfolioPost', PostSchema);


// You would follow a similar pattern for AboutPost, BlogPost, etc.

export { BulletContainerAboutUsModel, BulletContainerContentModel, BlogPostModel, PricingPostModel, AboutPostModel, WebDevelopmentPostModel, AppDevelopmentPostModel, GraphicDesignPostModel, ServicesPostModel, Web3PostModel,ProjectsPostModel, PortfolioPostModel, CategoryModel, CategorySchema };

