import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { Share, BookOpenText} from 'lucide-react';
import { XIcon, FaceBookIcon, EmailIcon, CopyLinkIcon, CheckMarkIcon } from './CustomIcons';
import { ImageSlider } from './ImageSlider';
import './TopContainer.css';
import { link } from 'fs';
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const TopContainer: React.FC<{ type: string }> = ({ type }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/about`);
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

 const handleReadMore = () => {

  navigate(`/about`);
 }
  
  

  return (
    <div className='TCPostContainer'>
      <Helmet>
      <link rel="icon" href="/OpenBox.svg" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        {/* Optionally, add for Apple devices */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {type && <title>{sanitizedTitleForTab}</title>}
        <meta name="description" content={post.description} />
        {post.keywords && (
          <meta name="keywords" content={post.keywords.join(', ')} />
        )}
      </Helmet>
      <div className='TCPost'>

      <div className='TC-container'>
          <div className='tc-img-section'>
            <div>
            <div className='TCImgContainer'>
              {post.images.length > 1 ? (
                <div className=''>
                <ImageSlider images={post.images} />
                </div>
              ) : (
                <div className='align-top'>
                <img className='TCPostImg' src={post.images[0]?.url} alt={post.images[0]?.alt} />
                </div>
              )}
            </div>
            </div>
          </div>
          <div className='tc-text-section'>
            <div className='TCTextContainer'>
            <div className='TCPostTitle'>
              <div className='sanitized-title' dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
            </div>
            <div className='TCPostText'>
              <div className='TCdescriptionParagraph' dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
              
              </div>
              <div className='tc-button-container'>
              <button type="submit" className="tc-button" onClick={handleReadMore}><BookOpenText className="icon"/><span className="tc-button-text">Read More</span></button>
              </div>
            </div>
            
           
          </div>
        </div>
       
      </div>
    </div>
  );
};

export default TopContainer;