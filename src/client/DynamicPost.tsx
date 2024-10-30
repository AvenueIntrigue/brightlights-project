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

  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description);

  return (
    <div className='BlogPostContainer'>
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.description} />
        {post.keywords && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
      </Helmet>
      <div className='BlogPost'>
        <div className='pricing-container w-[100%] flex'>
          <div className='img-section w-1/2'>
            <div className='BlogPostImgContainer'>
              {post.images.length > 1 ? (
                <ImageSlider images={post.images} />
              ) : (
                <img className='BlogPostImg' src={post.images[0]?.url} alt={post.images[0]?.alt} />
              )}
            </div>
          </div>
          <div className='text-section w-1/2 text-right'>
            <div className='BlogPostTitle'>
              <div dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
            </div>
            <div className='BlogPostText'>
              <div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
            </div>
            <div className='timestamp'>
              <p>Page: {post.page}</p>
              <p>Created On: {new Date(post.createdOn).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPost;
