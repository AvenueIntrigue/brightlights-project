import { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
const TopContainer = lazy(()=> import('./TopContainer'));
const BulletContainer = lazy(()=> import('./BulletContainer'));
const Web3Container = lazy(()=> import('./Web3Container'));
const ProjectContainer = lazy(()=> import('./ProjectContainer'));
import './Home.css';

import { all } from 'axios';


interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

function Home() {

  const [allKeywords, setAllKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);


  const handleBulletKeywordsChange = (newKeywords: string[]) => setAllKeywords(prev => [...new Set([...prev, ...newKeywords])]);
  useEffect(() => {
    const fetchAllKeywords = async () => {
      try {
        // Define all backend endpoints to fetch keywords from
        const endpoints = [
          'http://localhost:3000/api/about',
          'http://localhost:3000/api/web-development',
          'http://localhost:3000/api/app-development',
          'http://localhost:3000/api/graphic-design',
          // Add more endpoints as needed (e.g., for Web3Container, ProjectContainer)
        ];

        const responses = await Promise.all(
          endpoints.map(async endpoint => {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              const posts = Array.isArray(data) ? data : [data];
              return posts.flatMap(post => post.keywords || []);
            } else {
              console.error(`Error fetching from ${endpoint}`);
              return [];
            }
          })
        );

        // Combine and deduplicate keywords
        const combinedKeywords = [...new Set(responses.flat())];
        console.log('Combined Keywords:', combinedKeywords);
        setAllKeywords(combinedKeywords);
      } catch (error) {
        console.error('Error fetching keywords:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllKeywords();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }




  return (
    <div className="home-container">
      <Helmet>
        <meta name="keywords" content={allKeywords.join(', ')} />
        <title>Bright Lights Creative</title>
        {/* Add additional meta tags here */}
      </Helmet>
      <Suspense fallback={<div className="placeholder">Loading...</div>}>
        <TopContainer type="top" />
      </Suspense>

      <Suspense fallback={<div className="placeholder">Loading...</div>}>
      <BulletContainer keywords={allKeywords} onKeywordsChange={handleBulletKeywordsChange} />
      </Suspense>

      <Suspense fallback={<div className="placeholder">Loading...</div>}>
        <Web3Container type="web3" />
      </Suspense>

      <Suspense fallback={<div className="placeholder">Loading...</div>}>
        <ProjectContainer type="projects" />
      </Suspense>
     
      
    </div>
  );
}

export default Home;