import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ViteExpress from "vite-express";
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import encryptionKey from './generateKey.js'
import crypto from 'node:crypto';
import { BlogPostModel, BlogPost, PricingPostModel, AboutPostModel, ServicesPostModel, Web3PostModel, TopContainerContentModel, MiddleContainerContentModel, BulletContainerContentModel, web3ContainerContentModel, BulletContainerAboutUsModel, CategoryModel, GraphicDesignPostModel, AppDevelopmentPostModel, WebDevelopmentPostModel, ProjectsPostModel, PortfolioPostModel, marketingConsentContentModel} from '../shared/interfaces.js';

dotenv.config();

const uri = process.env.VITE_MONGODB_URI || 'defaultMongoUri';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || encryptionKey; // Fallback to generated key if ENV not set
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be set in .env and be 32 characters long');
}
const IV_LENGTH = 16;
// Explicitly type algorithm as a string to avoid GCM overload
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  // Type assertion for algorithm and ensure key is Buffer
  const cipher = crypto.createCipheriv('aes-256-cbc' as const, Buffer.from(ENCRYPTION_KEY, 'utf8') as Buffer, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const [iv, encryptedText] = text.split(':').map(part => Buffer.from(part, 'hex'));
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'utf8'), iv);
  // Use Buffer overload: no inputEncoding since encryptedText is already a Buffer
  let decrypted = decipher.update(encryptedText); // Returns Buffer
  decrypted = Buffer.concat([decrypted, decipher.final()]); // Concatenate Buffers
  return decrypted.toString('utf8'); // Convert to string
}
async function startServer() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }

  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });
}

const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Middleware to handle JSON errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Middleware Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});





// Rest of your main.ts remains the same...
// For brevity, I'll only show the updated /api/marketing part:

app.get('/api/marketing', async (req: Request, res: Response) => {
  console.log('GET /api/marketing hit');
  try {
    const content = await marketingConsentContentModel.findOne();
    if (content) {
      const decryptedContent = {
        ...content.toObject(),
        email: content.email ? decrypt(content.email) : null,
        phone: content.phone ? decrypt(content.phone) : null,
      };
      res.json(decryptedContent);
    } else {
      res.status(404).json({ message: 'Marketing consent content not found' });
    }
  } catch (error) {
    console.error('Error fetching marketing consent content:', error);
    res.status(500).json({ message: 'Error fetching marketing consent content', error });
  }
});

app.put('/api/marketing', async (req: Request, res: Response) => {
  try {
    const { email, phone, acceptsEmailMarketing, acceptsTextMarketing } = req.body;
    const encryptedEmail = email && acceptsEmailMarketing ? encrypt(email) : null;
    const encryptedPhone = phone && acceptsTextMarketing ? encrypt(phone) : null;

    const content = await marketingConsentContentModel.findOneAndUpdate(
      {},
      { email: encryptedEmail, phone: encryptedPhone, acceptsEmailMarketing, acceptsTextMarketing },
      { new: true, upsert: true }
    );

    const decryptedContent = {
      ...content.toObject(),
      email: content.email ? decrypt(content.email) : null,
      phone: content.phone ? decrypt(content.phone) : null,
    };

    res.json(decryptedContent);
  } catch (error) {
    console.error('Error updating marketing consent content:', error);
    res.status(500).send({ message: 'Error updating marketing consent content', error });
  }
});

app.post('/api/add-category', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const newCategory = new CategoryModel({ name });
    await newCategory.save();
    res.status(201).send({ message: 'Category added successfully' });
  } catch (error) {
    res.status(500).send({ message: 'Error adding category', error });
  }
});



app.post('/api/blogposts', async (req: Request, res: Response) => {
  try {
    const newPost = new BlogPostModel(req.body);
    await newPost.save();
    res.status(201).send({ id: newPost._id });
  } catch (error) {
    res.status(500).send({ message: 'Error creating blog post', error });
  }
});


app.get('/api/blogposts/:id', async (req: Request, res: Response) => {
  try {
    const post = await BlogPostModel.findById(req.params.id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).send({ message: 'Blog post not found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error fetching posts', error });
  }
});

app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const posts = await BlogPostModel.find();
    res.json(posts);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching blog posts', error });
  }
});

app.get('/api/topcontainer', async (req: Request, res: Response) => {
  console.log('GET /api/topcontainer hit'); // Debug log
  try {
    const content = await TopContainerContentModel.findOne();
    if (content) {
      res.json(content);
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    console.error('Error fetching top container content:', error);
    res.status(500).json({ message: 'Error fetching top container content', error });
  }
});

app.put('/api/topcontainer', async (req: Request, res: Response) => {
  try {
    const { image, imageAlt, title, description, keywords } = req.body;
    const content = await TopContainerContentModel.findOneAndUpdate({}, { image, imageAlt, title, description, keywords }, { new: true, upsert: true });
    res.json(content);
  } catch (error) {
    res.status(500).send({ message: 'Error updating top container content', error });
  }
});

app.get('/api/middlecontainer', async (req: Request, res: Response) => {
  try {
    const content = await MiddleContainerContentModel.findOne();
    if (content) {
      res.json(content);
    } else {
      res.status(404).send({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error fetching middle container content', error });
  }
});

app.put('/api/middlecontainer', async (req: Request, res: Response) => {
  try {
    const { image, imageAlt, title, description } = req.body;
    const content = await MiddleContainerContentModel.findOneAndUpdate({}, { image, imageAlt, title, description }, { new: true, upsert: true });
    res.json(content);
  } catch (error) {
    res.status (500).send({ message: 'Error updating middle container content', error });
  }
});


app.get('/api/bulletcontaineraboutus', async (req: Request, res: Response) => {
  try {
    const aboutUs = await BulletContainerAboutUsModel.findOne();
    if (aboutUs) {
      res.json(aboutUs);
    } else {
      res.status(404).send({ message: 'About Us content not found' });
    }
  } catch (error) {
    console.error('Error fetching About Us content:', error);
    res.status(500).send({ message: 'Error fetching About Us content', error });
  }
});

app.put('/api/bulletcontaineraboutus', async (req: Request, res: Response) => {
  try {
    const { _id, aboutUs } = req.body;

    const updatedAboutUs = await BulletContainerAboutUsModel.findOneAndUpdate(
      _id ? { _id: new mongoose.Types.ObjectId(_id) } : {}, // Use a string or omit _id for a new ObjectId
      { aboutUs },
      { new: true, upsert: true }
    );
    
    res.json(updatedAboutUs);
  } catch (error) {
    console.error('Error updating About Us content:', error);
    res.status(500).send({ message: 'Error updating About Us content', error });
  }
});



app.get('/api/bulletcontainercontent', async (req: Request, res: Response) => {
  try {
    const content = await BulletContainerContentModel.find();
    if (content.length > 0) {
      res.json(content);
    } else {
      res.status(404).send({ message: 'Bullets content not found' });
    }
  } catch (error) {
    console.error('Error fetching bullets content:', error);
    res.status(500).send({ message: 'Error fetching bullets content', error });
  }
});

app.put('/api/bulletcontainercontent', async (req: Request, res: Response) => {
  try {
    const { bullets } = req.body;
    const updatedBullets = [];
    for (const bullet of bullets) {
      const updatedBullet = await BulletContainerContentModel.findOneAndUpdate(
        { _id: bullet._id },
        bullet,
        { new: true, upsert: true }
      );
      updatedBullets.push(updatedBullet);
    }
    res.json(updatedBullets);
  } catch (error) {
    console.error('Error updating bullets content:', error);
    res.status(500).send({ message: 'Error updating bullets content', error });
  }
});


app.get('/api/web3container', async (req: Request, res: Response) => {
  try {
    const content = await web3ContainerContentModel.findOne();
    if (content) {
      res.json(content);
    } else {
      res.status(404).send({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error fetching web3 container content', error });
  }
});

app.put('/api/web3container', async (req: Request, res: Response) => {
  try {
    const { image, imageAlt, title, description, keywords } = req.body;
    const content = await web3ContainerContentModel.findOneAndUpdate({}, { image, imageAlt, title, description, keywords }, { new: true, upsert: true });
    res.json(content);
  } catch (error) {
    res.status(500).send({ message: 'Error updating top container content', error });
  }
});



app.get('/api/:type', async (req: Request, res: Response) => {
  const type = req.params.type; // 'pricing', 'about', 'services', etc.
  
  let Model;
  switch (type) {
    case 'pricing':
      Model = PricingPostModel;
      break;
    case 'about':
      Model = AboutPostModel;
      break;
    case 'services':
      Model = ServicesPostModel;
      break;
   
      case 'web-development':
        Model = WebDevelopmentPostModel;
        break;

        case 'app-development':
          Model = AppDevelopmentPostModel;
          break;

          case 'graphic-design':
            Model = GraphicDesignPostModel;
            break;

            case 'web3':
            Model = Web3PostModel;
            break;

            case 'projects':
              Model = ProjectsPostModel;
              break;

              case 'portfolioposts':
                Model = PortfolioPostModel;
                break;
         
       
     
      
    default:
      return res.status(400).send({ message: 'Invalid post type' });
  }

  try {
    const post = await Model.findOne();
    if (post) {
      res.json(post);
    } else {
      res.status(404).send({ message: `${type} post not found` });
    }
  } catch (error) {
    res.status(500).send({ message: `Error fetching ${type} post`, error });
  }
});



app.get('/api/web3', async (req: Request, res: Response) => {
  try {
    const post = await Web3PostModel.findOne();
    if (post) {
      res.json(post);
    } else {
      res.status(404).send({ message: 'Web3 post not found' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Error fetching Web 3 post', error });
  }
});



// Instead of having separate PUT routes for pricing and about, you can do:

// This route will handle both 'pricingposts' and 'aboutposts'
app.put('/api/:pageName', async (req: Request, res: Response) => {
  const { pageName } = req.params;
  let Model = null;

  switch (pageName) {
    case 'aboutposts':
      Model = AboutPostModel;
      break;
    case 'pricingposts':
      Model = PricingPostModel;
      break;
      case 'servicesposts':
      Model = ServicesPostModel;
      break;
      case 'web-developmentposts':
      Model = WebDevelopmentPostModel;
      break;

      case 'app-developmentposts':
        Model = AppDevelopmentPostModel;
        break;

        case 'graphic-designposts':
          Model = GraphicDesignPostModel;
          break;

    

     case 'web3posts':
      Model = Web3PostModel;
      break;

      case 'projectsposts':
        Model = ProjectsPostModel;
        break;

        case 'portfolioposts':
        Model = PortfolioPostModel;
        break;


    default:
      return res.status(400).send({
        message: 'Invalid page name',
        details: `The page name "${pageName}" is not supported.`
      });
  }

  try {
    // Delete old posts before creating or updating the new one
    await Model.deleteMany({});

    const newPost = new Model(req.body);
    await newPost.save();
    res.status(200).send({ id: newPost._id, message: `Successfully created ${pageName}` });
  } catch (error) {
    console.error(`Error in creating ${pageName}:`, error);

    if (error instanceof Error) {
      // Error is now known to be an instance of Error
      if (error.name === 'ValidationError') {
        const validationErrors = Object.keys((error as mongoose.Error.ValidationError).errors).map(key => ({
          field: key,
          message: (error as mongoose.Error.ValidationError).errors[key].message
        }));
        return res.status(400).send({
          message: `Validation error creating ${pageName}`,
          details: validationErrors
        });
      }

      // General error response
      res.status(500).send({
        message: `An error occurred while creating ${pageName}`,
        // In production, you might want to remove or sanitize this
        error: error.message
      });
    } else {
      // If error is not an instance of Error, log it and send a generic message
      console.error(`Unexpected error type in creating ${pageName}:`, error);
      res.status(500).send({
        message: `An unexpected error occurred while creating ${pageName}`
      });
    }
  }
});

// Keep other routes as they are if they don't need to change










startServer()
  .then(() => {
    ViteExpress.listen(app, 3000, () => {
      console.log('Server is listening on port 3000...');
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
  });