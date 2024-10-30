import axios from 'axios';
import { BlogPost, BulletContainerContent, BulletContainerAboutUs} from '../shared/interfaces.js';


export const fetchPosts = async (): Promise<BlogPost[]> => {
  const response = await fetch('http://localhost:3000/api/posts');
  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }
  return await response.json();
};

export const fetchTopContainerContent = async () => {
  const response = await axios.get('http://localhost:3000/api/topcontainer');
  if (response.status !== 200) {
    throw new Error('Failed to fetch top container content');
  }
  return response.data;
};

export const fetchMiddleContainerContent = async () => {
  const response = await axios.get('http://localhost:3000/api/middlecontainer');
  if (response.status !== 200) {
    throw new Error('Failed to fetch middle container content');
  }
  return response.data;
};

export const fetchAboutUs = async (): Promise<BulletContainerAboutUs> => {
  const response = await axios.get('/api/bulletcontaineraboutus');
  if (response.status !== 200) {
    throw new Error('Failed to fetch About Us content');
  }
  return response.data;
};

export const updateAboutUs = async (aboutUs: string, token: string): Promise<BulletContainerAboutUs> => {
  const response = await fetch('/api/bulletcontaineraboutus', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ aboutUs }),
  });
  if (!response.ok) {
    throw new Error('Failed to update About Us content');
  }
  return response.json();
};



export const fetchBulletContainerContent = async (): Promise<BulletContainerContent[]> => {
  const response = await axios.get('/api/bulletcontainercontent');
  if (response.status !== 200) {
    throw new Error('Failed to fetch bullets content');
  }
  return response.data;  // Ensure this is an array
};



// Example function definition
export const updateBulletContainerContent = async (content: { bullets: BulletContainerContent[]}, token: string): Promise<{ bullets: BulletContainerContent[]}> => {
  const response = await fetch('/api/bulletcontainercontent', {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });
  return response.json(); // Expect this to return an object with bullets and aboutUs
};

export const fetchWeb3ContainerContent = async () => {
  const response = await axios.get('http://localhost:3000/api/web3container');
  if (response.status !== 200) {
    throw new Error('Failed to fetch web3 container content');
  }
  return response.data;
};