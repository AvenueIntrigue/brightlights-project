import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { fetchPostByType } from './api';
import { useNavigate } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { BlogPost } from '../shared/interfaces.js'; // Use shared interface
import './UniversalContainer.css';


interface UniversalContainerProps {
  type: string;
  direction: 'ltr' | 'rtl';
  navigateTo?: string;
}

const UniversalContainer: React.FC<UniversalContainerProps> = ({ type, direction, navigateTo }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await fetchPostByType(type); // Fetch from /api/:type in main.ts
        setPost(data);
      } catch (error) {
        console.error(`Error fetching ${type} post: `, error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [type]);

  if (loading) {
    return null; // Matches original behavior
  }

  if (!post) {
    return <div>{type.charAt(0).toUpperCase() + type.slice(1)} post not found</div>;
  }

  const sanitizedTitleForTab = DOMPurify.sanitize(post.title, { ALLOWED_TAGS: [] }).replace(/<\/?[^>]+(>|$)/g, "");
  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'span', 'div', 'img', 'a'],
    ALLOWED_ATTR: ['style', 'class', 'src', 'href', 'alt'],
  });

  const handleReadMore = () => {
    navigate(navigateTo || `/${type}`);
  };

  return (
    <div className="UCPostContainer">
      <Helmet>
        <link rel="icon" href="/OpenBox.svg" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {type && <title>{sanitizedTitleForTab}</title>}
        <meta name="description" content={post.description} />
        {post.keywords && <meta name="keywords" content={post.keywords.join(', ')} />}
      </Helmet>
      <div className="Grandpa mx-auto">
        <div className={`UC-container w-full m-0 direction-${direction}`}>
          <div className="uc-img-section">
            <div className="UCImgContainer">
              {post.images.length > 1 ? (
                <ImageSlider images={post.images} />
              ) : (
                <img className="UCPostImg" src={post.images[0]?.url} alt={post.images[0]?.alt} />
              )}
            </div>
          </div>
          <div className="uc-text-section">
            <div className="UCTextContainer">
              <div className="UCPostTitle">
                <div className="sanitized-title" dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
              </div>
              <div className="UCPostText">
                <div className="UCdescriptionParagraph" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
              </div>
              <div className="uc-button-container">
                <button type="submit" className="uc-button" onClick={handleReadMore}>
                  <BookOpenText className="icon" />
                  <span className="uc-button-text">Read More</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr className="line" />
    </div>
  );
};

export default UniversalContainer;