import "./blogcard.css";
import React from "react";
import { BlogPost } from "../shared/interfaces";
import { Navigate, useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { BookOpenText } from "lucide-react";

interface BlogCardProps {
  post: BlogPost;
}

const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/blog/${post._id}`);
  };

  // Truncation function
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + "...";
  };

  // Function to sanitize the description by removing <img> tags
  const sanitizeDescription = (description: string) => {
    return DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ["b", "i", "strong", "em", "a"], // Allow basic inline tags
      ALLOWED_ATTR: ["href", "target", "rel"], // Allow necessary attributes for links
    });
  };

  // Allow the full title but prevent scripts or dangerous tags
  const sanitizedTitle = DOMPurify.sanitize(post.title, {
    ALLOWED_TAGS: [], // Remove all HTML tags from the title
  });

  const sanitizedDescription = sanitizeDescription(post.description);
  return (
    <div className="blog-card-container">
      <div className="blogcard">
        <div className="blogcard-img-container">
          <img
            className="blogcard-img"
            src={post.images[0]?.url}
            alt={post.images[0]?.alt}
          />
        </div>
        <div className="blogcard-text">
          <div className="blogcard-title">
            <h2 dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
          </div>
          <div className="blogcard-description">
            <h4
              className="description"
              dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
            />
          </div>
          <div className="blogcard-button-container">
            <button
              type="submit"
              className="blogcard-button"
              onClick={handleReadMore}
            >
              <BookOpenText className="icon" />
              <span className="button-text">Read More</span>
            </button>
          </div>
        </div>
      </div>
      <hr className="line" />
    </div>
  );
};

export default BlogCard;
