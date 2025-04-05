import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Share } from 'lucide-react';
import {  faGithub } from '@fortawesome/free-brands-svg-icons';
import { XIcon, FaceBookIcon, EmailIcon, CopyLinkIcon, CheckMarkIcon } from './CustomIcons';
import { ImageSlider } from './ImageSlider';
import './Portfolio.css';
import { link } from 'fs';
import DynamicPost from './DynamicPost';
import GitHubSvg from './GitHubSvg';
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const Portfolio: React.FC<{ type: string }> = ({ type }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  
  const handleGitHubNav = () => {
    window.open('https://github.com/AvenueIntrigue', '_blank');
  };
  
  

  return (
    <div className='flex flex-col'>
      <div className='flex m-0'>
          <DynamicPost type={'portfolioposts'}/>
          </div>
          <div className='w-[80%] mx-auto'>
              <div className='PO-button-container flex '>
              <button type="button" className="po-button flex" onClick={handleGitHubNav}><GitHubSvg/><span className="po-button-text">View GitHub Repository</span></button>
              </div>
              </div>
    </div>
  );
};

export default Portfolio;