import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useUser, useSession } from '@clerk/clerk-react';
import { Book } from 'lucide-react';
import DOMPurify from 'dompurify';
import { SkeletonImage, SkeletonText } from './SkeletonComponent';
import './Web3Container.css';
import { link } from 'fs';

interface PublicMetadata {
  permissions?: string[];
}

interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}



const Web3Container: React.FC<{type: string}> = ({ type }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to strip HTML tags
function stripHtml(html: string): string {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/web3`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          console.error(`Error fetching ${type} post`);
        }
      } catch (error) {
        console.error(`Error fetching ${type} post: `, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [type]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>{type.charAt(0).toUpperCase() + type.slice(1)} post not found</div>;
  }

    // Strip HTML tags from title and description
    const strippedTitle = stripHtml(post.title);
    const strippedDescription = stripHtml(post.description);

  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description);


  const handleReadMore = async () => {
    navigate(`/web3`); // Navigate to the specific web3 article
  };

  const handleEditClick = async () => {

    navigate('/create');

  };

  return (
    <div className='web3-container-grand pt-[7%]'>
      <Helmet>
        <title>{sanitizedTitle}</title>
        <meta name="description" content={sanitizedDescription} />
        {post.keywords && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
      </Helmet>
      <hr className='line-web3' />
      <div className="web3-container">
        <div className='img-container mx-auto mb-4'>
          {post.images && post.images.length > 0 ? 
            <img className="image" src={post.images[0].url} alt={post.images[0].alt} /> 
            : <SkeletonImage />
          }
        </div>
        <div className="web3-container-text">
          <div className='web3-title mb-4'>
          <h1 className='about-us p-2'>{strippedTitle}</h1>
          </div>
          <div className='web3-description mb-4'>
          <h4>{strippedDescription}</h4>
          </div>
          <div className='w-full p-4 flex justify-end'>
            <button onClick={handleReadMore} className='readMore-button'>
              <div className='flex p-2'>
                <div className='pr-1'><Book/></div>
                <div className='pl-1'>Read More</div>
              </div>
            </button>
          </div>
          {user &&  // Check if user is logged in
          <div className='ml-0'>
            <button className="web3-edit-button w-1/4 rounded-md" onClick={handleEditClick}>
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default Web3Container;