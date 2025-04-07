import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { ImageSlider } from "./ImageSlider";
import { BlogPost } from "../shared/interfaces.js"; // Shared interface for post types
import { fetchPostByType } from "./api";




const DynamicPost: React.FC<{ type: string }> = ({ type }) => {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await fetchPostByType(type);
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
    return <div>Loading...</div>;
  }

  if (!post) {
    return (
      <div>{type.charAt(0).toUpperCase() + type.slice(1)} post not found</div>
    );
  }

  // Sanitize the title but strip all tags for the tab title
  const sanitizedTitleForTab = DOMPurify.sanitize(post.title, {
    ALLOWED_TAGS: [],
  }).replace(/<\/?[^>]+(>|$)/g, "");

  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description, {
    ALLOWED_TAGS: ["h1", "h2", "h3", "p", "br", "span", "div", "img", "a"],
    ALLOWED_ATTR: ["style", "class", "src", "href", "alt"],
  });

  return (
    <div className="PostContainer">
      <Helmet>
        <link rel="icon" href="/OpenBox.svg" type="image/x-icon" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <title>{sanitizedTitleForTab}</title>
        <meta name="description" content={post.description} />
        <meta name="keywords" content={post.keywords?.join(", ") || ""} />
      </Helmet>
      <div className="Grandpa">
        <div className="post-container">
          <div className="post-img-section">
            <div className="PostImgContainer">
              {post.images.length > 1 ? (
                <div className="PostImgContainer m-0">
                  <ImageSlider images={post.images} />
                </div>
              ) : (
                <div className="PostImgContainer m-0">
                  <img
                    className="PostImg"
                    src={post.images[0]?.url}
                    alt={post.images[0]?.alt}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="post-text-section">
            <div className="PostTitle">
              <div
                className="sanitized-title"
                dangerouslySetInnerHTML={{ __html: sanitizedTitle }}
              />
            </div>
            <div className="PostText">
              <div className="descriptionParagraphContainer">
                <div
                  className="descriptionParagraph"
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPost;