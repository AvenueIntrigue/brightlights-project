/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN: string;
  readonly VITE_AUTH0_CLIENT_ID: string;
  readonly VITE_AUTH0_AUDIENCE: string;
  readonly VITE_AUTH0_SCOPE: string;
  
  readonly VITE_CLERKVITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CLERK_Instance_ID: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
readonly VITE_CLOUDINARY_API_KEY: string;
 readonly VITE_CLOUDINARY_API_SECRET: string;
readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
readonly VITE_MONGODB_URI: string;
  // Add more environment variables here if needed...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
