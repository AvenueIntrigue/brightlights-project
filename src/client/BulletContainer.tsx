import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { BookOpenText } from "lucide-react";
import "./BulletContainer.css";

// Define the Post interface locally (or import from ../shared/interfaces.js if specific models are defined)
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  pages: string; // Note: 'pages' matches your original interface
  createdOn: string;
  keywords?: string[];
}

// Fetch function to get a post by type from main.ts
const fetchPostByType = async (type: string): Promise<Post> => {
  const API_URL = import.meta.env.VITE_API_URL || ""; // Consistent with api.ts
  const response = await fetch(`${API_URL}/api/${type}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${type} post: ${response.statusText}`);
  }
  return response.json();
};

export interface BulletContainerProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}

const BulletContainer: React.FC<BulletContainerProps> = ({
  keywords,
  onKeywordsChange,
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const types = ["web-development", "app-development", "graphic-design"];
        const responses = await Promise.all(
          types.map(async (type) => {
            try {
              const data = await fetchPostByType(type); // Fetch from /api/:type in main.ts
              return data; // Expecting a single Post object
            } catch (err) {
              console.error(`Error fetching ${type} post:`, err);
              return null; // Return null for failed fetches
            }
          })
        );

        // Filter out null responses and set posts
        const validPosts = responses.filter((post): post is Post => post !== null);
        setPosts(validPosts);

        // Update keywords
        const allKeywords = validPosts.flatMap((post) => post.keywords || []);
        onKeywordsChange([...new Set([...keywords, ...allKeywords])]);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError("Failed to load bullet points.");
      }
    };

    fetchPosts();
  }, [keywords, onKeywordsChange]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (posts.length === 0 && !error) {
    return null; // Wait for data without showing "Loading..."
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
      <Helmet>
        <meta
          name="description"
          content="Explore our web, app, and graphic design services"
        />
        <meta
          name="keywords"
          content={[
            ...keywords,
            ...posts.flatMap((post) => post.keywords || []),
          ].join(", ")}
        />
      </Helmet>

      <div className="bullet-container">
        {posts.map((post, index) => {
          const sanitizedTitle = DOMPurify.sanitize(post.title, {
            ALLOWED_TAGS: [],
          });
          const sanitizedDescription = DOMPurify.sanitize(post.description, {
            ALLOWED_TAGS: [
              "h1",
              "h2",
              "h3",
              "p",
              "br",
              "span",
              "div",
              "img",
              "a",
            ],
            ALLOWED_ATTR: ["style", "class", "src", "href", "alt"],
          });

          return (
            <div key={index} className="bullet-item">
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
              <hr className="line-item" />
            </div>
          );
        })}
      </div>
      <hr className="line-bullet" />
    </div>
  );
};

export default BulletContainer;