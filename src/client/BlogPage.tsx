import { fetchPosts } from "../server/api";
import BlogCard from "./BlogCard";
import { BlogPost } from "../shared/interfaces";
import DOMPurify from "dompurify";
import "./BlogPage.css";

import React, { useState, useEffect } from "react";

interface BlogPageProps {}

interface CustomError extends Error {}

const BlogPage: React.FC<BlogPageProps> = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<CustomError | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchPosts();
        setPosts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setError(
          error instanceof Error
            ? error
            : new Error("An Unknown Error has Occured")
        );
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="blogpage-container">
      {loading ? ( // Render loading state
        <p>Loading...</p>
      ) : error ? ( // Render error state
        <p>Error: {error.message}</p>
      ) : (
        // Render posts if there are no loading or error states
        posts.map((post) => <BlogCard key={post._id?.toString()} post={post} />)
      )}
    </div>
  );
};

export default BlogPage;
