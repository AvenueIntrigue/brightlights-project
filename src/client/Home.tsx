import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import UniversalContainer from "./UniversalContainer";
import BulletContainer from "./BulletContainer";
import "./Home.css";

interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

const Home: React.FC = React.memo(() => {
  const [allKeywords, setAllKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWithTimeout = async (url: string, timeout = 5000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
          console.error(`Fetch failed for ${url}: ${response.status}`);
          return [];
        }
        const data = await response.json();
        console.log(`Data from ${url}:`, data);
        const posts = Array.isArray(data) ? data : [data];
        return posts.flatMap((post: Post) => post.keywords || []);
      } catch (err) {
        console.error(`Error fetching ${url}:`, err);
        return [];
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const fetchAllKeywords = async () => {
      try {
        const endpoints = [
          "/api/aboutposts",
          "/api/web-developmentposts",
          "/api/app-developmentposts",
          "/api/graphic-designposts",
        ];

        console.log("Fetching keywords from:", endpoints);
        const responses = await Promise.all(
          endpoints.map((endpoint) => fetchWithTimeout(endpoint))
        );

        const combinedKeywords = [...new Set(responses.flat())];
        console.log("Combined keywords:", combinedKeywords);
        setAllKeywords(combinedKeywords);
        setLoading(false);
      } catch (error) {
        console.error("Unexpected error in fetchAllKeywords:", error);
        setError("Failed to load keywords.");
        setLoading(false);
      }
    };

    fetchAllKeywords();
  }, []);

  console.log("Home rendered", { loading, error, keywords: allKeywords });

  if (loading) return <div className="placeholder">Loading Keywords...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-container">
      <Helmet>
        <meta name="keywords" content={allKeywords.join(", ")} />
        <title>Bright Lights Creative</title>
      </Helmet>
      <UniversalContainer type="about" direction="ltr" navigateTo="/about" />
      <BulletContainer />
      <UniversalContainer type="web3" direction="rtl" navigateTo="/web3" />
      <UniversalContainer type="projects" direction="ltr" navigateTo="/projects" />
    </div>
  );
});

export default Home;