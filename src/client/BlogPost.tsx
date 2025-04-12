import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import type { BlogPost } from "../shared/interfaces";
import "../client/BlogPost.css";
import { Share } from "lucide-react";

import {
  XIcon,
  FaceBookIcon,
  EmailIcon,
  CopyLinkIcon,
  CheckMarkIcon,
} from "./CustomIcons";

import { ImageSlider } from "./ImageSlider";

const CopyLinkButton: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Show checkmark for 2 seconds
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <button className="icon-button" onClick={copyLink}>
      {isCopied ? <CheckMarkIcon /> : <CopyLinkIcon />}
    </button>
  );
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareVisible, setIsShareVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchBlogPost = async () => {
      try {
        const response = await fetch(`/api/blogposts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setPost(data);
        } else {
          const errorText = await response.text();
          console.error("Error fetching blog post", errorText);
        }
      } catch (error) {
        console.error("Error fetching blog post", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!post) {
    return <div>Blog post not found</div>;
  }

  const sanitizedTitle = DOMPurify.sanitize(post.title);
  const sanitizedDescription = DOMPurify.sanitize(post.description);

  const toggleShare = () => {
    setIsShareVisible(!isShareVisible);
  };

  const handleShareOnX = () => {
    var currentUrl = window.location.href;
    var xUrl =
      "https://www.x.com/intent/tweet?url=" + encodeURIComponent(currentUrl);
    window.open(xUrl, "_blank", "width=550, height=420");
  };

  const handleShareOnFacebook = () => {
    var currentUrl = window.location.href;
    var fbUrl =
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(currentUrl);
    window.open(fbUrl, "_blank", "width=600, height=400");
  };

  const handleShareViaEmail = () => {
    var currentUrl = window.location.href;
    var emailSubject = encodeURIComponent("Check out this link"); // You can customize this
    var emailBody = encodeURIComponent(
      "I thought you might find this interesting: " + currentUrl
    );
    var mailtoLink =
      "mailto:?subject=" +
      emailSubject +
      "&body=" +
      emailBody +
      "%0D%0A" +
      "%0D%0A" +
      currentUrl;
    window.location.href = mailtoLink;
  };

  return (
    <div className="BlogPostContainer">
      {/* Dynamically set the meta tags for keywords */}
      <Helmet>
        <title>{post.title}</title>
        <meta name="description" content={post.description} />
        {post.keywords && (
          <meta name="keywords" content={post.keywords.join(", ")} />
        )}
      </Helmet>
      <div className="BlogPost">
        <div className="BlogPostTitle">
          <div dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
        </div>
        <div className="img-section">
          <div className="BlogPostImgContainer">
            {post.images.length > 1 ? (
              <ImageSlider images={post.images} />
            ) : (
              <img
                className="BlogPostImg"
                src={post.images[0]?.url}
                alt={post.images[0]?.alt}
              />
            )}
          </div>
        </div>
        <div className="BlogPostText">
          <div dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
          <div className="BlogPostLesserText">
            <div className="icon-toolbar">
              <button
                type="button"
                onClick={toggleShare}
                className="icon-button"
              >
                <Share className="mx-auto h-10 w-10" />
              </button>

              {isShareVisible && (
                <div className="">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={handleShareOnX}
                  >
                    <XIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={handleShareOnFacebook}
                  >
                    <FaceBookIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={handleShareViaEmail}
                  >
                    <EmailIcon />
                  </button>
                  <CopyLinkButton />
                </div>
              )}
            </div>

            <div className="pt-3">
              <p>Category: {post.category}</p>
              <p>Created On: {new Date(post.createdOn).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPost;
