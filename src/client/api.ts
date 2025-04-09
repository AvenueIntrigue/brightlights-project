import axios from "axios";
import { BlogPost, BulletContainerContent, BulletContainerAboutUs } from "../shared/interfaces";

// Use VITE_API_URL locally, default to relative path on Render
const API_URL = import.meta.env.VITE_API_URL || "";

// api.ts
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

export const fetchPostByType = async (type: string): Promise<Post> => {
  const url = `/api/${type}posts`; // Always relative
  console.log(`Fetching from: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Fetch failed for ${type}posts: ${response.status}`);
    throw new Error(`Failed to fetch ${type}posts: ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`Fetched data for ${type}posts:`, data);
  return data;
};



export const fetchPosts = async (): Promise<BlogPost[]> => {
  const response = await fetch("/api/posts");
  if (!response.ok) throw new Error("Failed to fetch posts");
  return response.json();
};

export const fetchTopContainerContent = async () => {
  const response = await axios.get("/api/topcontainer");
  if (response.status !== 200) throw new Error("Failed to fetch top container content");
  return response.data;
};

export const fetchMiddleContainerContent = async () => {
  const response = await axios.get("/api/middlecontainer");
  if (response.status !== 200) throw new Error("Failed to fetch middle container content");
  return response.data;
};

export const fetchAboutUs = async (): Promise<BulletContainerAboutUs> => {
  const response = await axios.get("/api/bulletcontaineraboutus");
  if (response.status !== 200) throw new Error("Failed to fetch About Us content");
  return response.data;
};

export const updateAboutUs = async (aboutUs: string, token: string): Promise<BulletContainerAboutUs> => {
  const response = await fetch("/api/bulletcontaineraboutus", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aboutUs }),
  });
  if (!response.ok) throw new Error("Failed to update About Us content");
  return response.json();
};

export const fetchBulletContainerContent = async (): Promise<BulletContainerContent[]> => {
  const response = await axios.get("/api/bulletcontainercontent");
  if (response.status !== 200) throw new Error("Failed to fetch bullets content");
  return response.data;
};

export const updateBulletContainerContent = async (
  content: { bullets: BulletContainerContent[] },
  token: string
): Promise<{ bullets: BulletContainerContent[] }> => {
  const response = await fetch("/api/bulletcontainercontent", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });
  if (!response.ok) throw new Error("Failed to update bullet container content");
  return response.json();
};

export const fetchWeb3ContainerContent = async () => {
  const response = await axios.get("/api/web3container");
  if (response.status !== 200) throw new Error("Failed to fetch web3 container content");
  return response.data;
};

export const marketingConsentContent = async () => {
  const response = await axios.get("/api/marketing");
  if (response.status !== 200) throw new Error("Failed to fetch marketing content");
  return response.data;
};