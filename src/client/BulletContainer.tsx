import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import "./BulletContainer.css";
import { BookOpenText } from "lucide-react";

interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  pages: string;
  createdOn: string;
  keywords?: string[];
}

export interface BulletContainerProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}

const BulletContainer: React.FC<BulletContainerProps> = ({
  keywords,
  onKeywordsChange,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const endpoints = [
          "http://localhost:3000/api/web-development",
          "http://localhost:3000/api/app-development",
          "http://localhost:3000/api/graphic-design",
        ];

        const responses = await Promise.all(
          endpoints.map(async (endpoint) => {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              return Array.isArray(data) ? data : [data];
            } else {
              console.error(`Error fetching from ${endpoint}`);
              return [];
            }
          })
        );

        const combinedPosts = responses.flat();
        setPosts(combinedPosts);

        const allKeywords = combinedPosts.flatMap((post) => post.keywords || []);
        onKeywordsChange([...new Set([...keywords, ...allKeywords])]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [keywords, onKeywordsChange]);

  if (isLoading) {
    throw new Promise(() => {});
  }

  const handleReadMore = (pages: string) => {
    if (!pages || pages === "undefined") {
      console.error("Page is undefined, defaulting to /home");
      navigate("/home");
    } else {
      navigate(`/${pages}`);
    }
  };

  return (
    <div className="Grandpa">
      <hr className="line-bullet"/>
      <Helmet>
        <meta
          name="keywords"
          content={[...keywords, ...posts.flatMap((post) => post.keywords || [])].join(", ")}
        />
      </Helmet>

      
      <div className="bullet-container">
        {posts.length === 0 ? (
          <p>No posts available.</p>
        ) : (
          posts.map((post, index) => {
            const sanitizedTitle = DOMPurify.sanitize(post.title, { ALLOWED_TAGS: [] });
            const sanitizedDescription = DOMPurify.sanitize(post.description, {
              ALLOWED_TAGS: ["h1", "h2", "h3", "p", "br", "span", "div", "img", "a"],
              ALLOWED_ATTR: ["style", "class", "src", "href", "alt"],
            });

            return (
              
              <div key={index} className="bullet-item">
                
                <hr className="line-item" /> {/* Line per item */}
                <div className="bullet-img-section">
                  <div className="bullet-img-container">
                    <img
                      className="bullet-img"
                      src={post.images[0]?.url}
                      alt={post.images[0]?.alt}
                    />
                  </div>
                </div>
                <div className="bullet-text-section">
                  <div className="BulletTitle">
                    <h2 className="bullet-title">{sanitizedTitle}</h2>
                  </div>
                  <div className="BulletText">
                    <div
                      className="bullet-description"
                      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                    />
                  </div>
                </div>
                <div className="bc-button-master">
                  <div className="bc-button-container">
                    <button
                      type="button"
                      className="bc-button"
                      onClick={() => handleReadMore(post.pages)}
                    >
                      <BookOpenText className="icon" />
                      <span className="bc-button-text">Read More</span>
                    </button>
                  </div>
                </div>
                
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BulletContainer;