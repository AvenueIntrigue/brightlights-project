import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { useParams } from 'react-router-dom';
import { Share } from 'lucide-react';
import { XIcon, FaceBookIcon, EmailIcon, CopyLinkIcon, CheckMarkIcon } from './CustomIcons';
import { ImageSlider } from './ImageSlider';
import './DynamicPost.css';
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const DynamicPost: React.FC<{ type: string }> = ({ type }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/${type}`);
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

    // Sanitize the title but strip all tags for the tab title
    const sanitizedTitleForTab = DOMPurify.sanitize(post.title, {
      ALLOWED_TAGS: []
    }).replace(/<\/?[^>]+(>|$)/g, "");

  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description, {
    // Allow specific attributes or tags if needed
    ALLOWED_TAGS: ['h1','h2','h3','p', 'br', 'span', 'div', 'img', 'a', /* other tags */],
    ALLOWED_ATTR: ['style', 'class', 'src', 'href', 'alt', /* other attributes */]
  });

  

  return (
    <div className='PricingPostContainer w-[80%]'>
      <Helmet>
      <link rel="icon" href="/OpenBox.svg" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        {/* Optionally, add for Apple devices */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title >{sanitizedTitleForTab}</title>
        <meta name="description" content={post.description} />
        {post.keywords && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
      </Helmet>
      <div className='PricingPost w-full'>

      <div className='pricing-container w-full'>
          <div className='pricing-img-section'>
            <div className='PricingPostImgContainer'>
              {post.images.length > 1 ? (
                <div className=''>
                <ImageSlider images={post.images} />
                </div>
              ) : (
                <div className='align-top'>
                <img className='PricingPostImg' src={post.images[0]?.url} alt={post.images[0]?.alt} />
                </div>
              )}
            </div>
          </div>
          <div className='pricing-text-section'>
            <div className='DynamicPostTitle'>
              <div className='sanitized-title' dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
            </div>
            <div className='descriptionParagraphContainer'>
              <div className='descriptionParagraph' dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
              
            </div>
            
           
          </div>
        </div>
       
      </div>
    </div>
  );
};

export default DynamicPost;