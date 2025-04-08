import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { BookOpenText } from "lucide-react";
import "./BulletContainer.css";

interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const fetchPostByType = async (type: string): Promise<Post | null> => {
  try {
    const response = await fetch(`/api/${type}posts`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.error(`Fetch failed for ${type}posts: ${response.status}`);
      return null;
    }
    const data = await response.json();
    console.log(`Fetched ${type}posts:`, data);
    return {
      title: data.title,
      description: data.description,
      images: data.images,
      page: data.pages || data.page || type,
      createdOn: data.createdOn,
      keywords: data.keywords,
    };
  } catch (err) {
    console.error(`Error fetching ${type}posts:`, err);
    return null;
  }
};

const BulletContainer: React.FC = React.memo(() => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      console.log("Fetching posts..."); // Debug
      const types = ["web-development", "app-development", "graphic-design"];
      const responses = await Promise.all(types.map((type) => fetchPostByType(type)));
      const validPosts = responses.filter((post): post is Post => post !== null);

      if (isMounted) {
        setPosts(validPosts);
        setLoading(false);
        if (validPosts.length === 0) setError("No posts available.");
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []); // Empty deps - runs once

  console.log("BulletContainer rendered", { loading, error, posts: posts.length }); // Debug

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (posts.length === 0) return <div>No posts available yet.</div>;

  const handleReadMore = (page: string) => {
    navigate(`/${page.toLowerCase()}`);
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
          content={posts.flatMap((post) => post.keywords || []).join(", ")}
        />
      </Helmet>
      <div className="bullet-container">
        {posts.map((post, index) => {
          const sanitizedTitle = DOMPurify.sanitize(post.title, { ALLOWED_TAGS: [] });
          const sanitizedDescription = DOMPurify.sanitize(post.description, {
            ALLOWED_TAGS: ["h1", "h2", "h3", "p", "br", "span", "div", "img", "a"],
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
                    onClick={() => handleReadMore(post.page)}
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
});

export default BulletContainer;