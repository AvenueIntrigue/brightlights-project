import axios from "axios";
import { BlogPost, BulletContainerContent, BulletContainerAboutUs } from "../shared/interfaces.js";

// Use VITE_API_URL locally, default to relative path on Render
const API_URL = import.meta.env.VITE_API_URL || "";

export const fetchPosts = async (): Promise<BlogPost[]> => {
  const response = await fetch(`${API_URL}/api/posts`);
  if (!response.ok) {
    throw new Error("Failed to fetch posts");
  }
  return await response.json();
};

export const fetchTopContainerContent = async () => {
  const response = await axios.get(`${API_URL}/api/topcontainer`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch top container content");
  }
  return response.data;
};

export const fetchMiddleContainerContent = async () => {
  const response = await axios.get(`${API_URL}/api/middlecontainer`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch middle container content");
  }
  return response.data;
};

export const fetchAboutUs = async (): Promise<BulletContainerAboutUs> => {
  const response = await axios.get(`${API_URL}/api/bulletcontaineraboutus`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch About Us content");
  }
  return response.data;
};

export const updateAboutUs = async (aboutUs: string, token: string): Promise<BulletContainerAboutUs> => {
  const response = await fetch(`${API_URL}/api/bulletcontaineraboutus`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aboutUs }),
  });
  if (!response.ok) {
    throw new Error("Failed to update About Us content");
  }
  return response.json();
};

export const fetchBulletContainerContent = async (): Promise<BulletContainerContent[]> => {
  const response = await axios.get(`${API_URL}/api/bulletcontainercontent`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch bullets content");
  }
  return response.data;
};

export const updateBulletContainerContent = async (
  content: { bullets: BulletContainerContent[] },
  token: string
): Promise<{ bullets: BulletContainerContent[] }> => {
  const response = await fetch(`${API_URL}/api/bulletcontainercontent`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });
  if (!response.ok) {
    throw new Error("Failed to update bullet container content");
  }
  return response.json();
};

export const fetchWeb3ContainerContent = async () => {
  const response = await axios.get(`${API_URL}/api/web3container`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch web3 container content");
  }
  return response.data;
};

export const marketingConsentContent = async () => {
  const response = await axios.get(`${API_URL}/api/marketing`);
  if (response.status !== 200) {
    throw new Error("Failed to fetch marketing content");
  }
  return response.data;
};