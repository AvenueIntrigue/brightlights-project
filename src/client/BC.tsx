import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Share, BookOpenText } from "lucide-react";
import {
  XIcon,
  FaceBookIcon,
  EmailIcon,
  CopyLinkIcon,
  CheckMarkIcon,
} from "./CustomIcons";
import { ImageSlider } from "./ImageSlider";
import "./TopContainer.css";
import { link } from "fs";
interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const BContainer: React.FC<{ type: string }> = ({ type }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllPosts = async () => {
      try {
        // Define the endpoints you want to fetch from
        const endpoints = [
          "http://localhost:3000/api/about",
          "http://localhost:3000/api/projects",
          "http://localhost:3000/api/contact",
        ];

        // Fetch all data concurrently
        const responses = await Promise.all(
          endpoints.map((endpoint) =>
            fetch(endpoint).then((res) => {
              if (!res.ok) throw new Error(`Error fetching ${endpoint}`);
              return res.json();
            })
          )
        );

        // Set the combined data
        setPosts(responses);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPosts();
  }, []); // Empty dependency array since we fetch once on mount

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!posts.length) {
    return <div>No posts found</div>;
  }

  const handleReadMore = (page: string) => {
    navigate(`/${page}`); // Navigate to the specific page (e.g., /about)
  };

  return (
    <div className="TCPostContainer">
      <Helmet>
        <title>Combined Posts</title>
        <meta
          name="description"
          content="A compilation of posts from multiple pages"
        />
      </Helmet>
      {posts.map((post, index) => {
        const sanitizedTitle = DOMPurify.sanitize(post.title);
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
          <div key={index} className="TCPost">
            <div className="TC-container flex">
              <div className="tc-img-section">
                <div className="TCImgContainer">
                  <img
                    className="TCPostImg"
                    src={post.images[0]?.url}
                    alt={post.images[0]?.alt}
                  />
                </div>
              </div>
              <div className="tc-text-section">
                <div className="flex flex-col p-4">
                  <div className="TCPostTitle">
                    <div dangerouslySetInnerHTML={{ __html: sanitizedTitle }} />
                  </div>
                  <div
                    className="TCPostText"
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                  <div className="tc-button-container">
                    <button
                      type="button"
                      className="tc-button"
                      onClick={() => handleReadMore(post.page)}
                    >
                      <BookOpenText className="icon" />
                      <span className="tc-button-text">Read More</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {index < posts.length - 1 && <hr className="line-middle" />}
          </div>
        );
      })}
    </div>
  );
};

export default BContainer;
