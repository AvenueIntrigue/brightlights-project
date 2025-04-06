import { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
const UniversalContainer = lazy(() => import('./UniversalContainer'));
const BulletContainer = lazy(() => import('./BulletContainer'));
const Web3Container = lazy(() => import('./UniversalContainer'));
const ProjectContainer = lazy(() => import('./UniversalContainer'));
import './Home.css';


interface Post {
  title: string;
  description: string;
  images: Array<{ url: string; alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

function Home() {
  const [allKeywords, setAllKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBulletKeywordsChange = (newKeywords: string[]) =>
    setAllKeywords((prev) => [...new Set([...prev, ...newKeywords])]);

  useEffect(() => {
    const fetchAllKeywords = async () => {
      try {
        const endpoints = [
          'http://localhost:3000/api/about',
          'http://localhost:3000/api/web-development',
          'http://localhost:3000/api/app-development',
          'http://localhost:3000/api/graphic-design',
        ];

        const responses = await Promise.all(
          endpoints.map(async (endpoint) => {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              const posts = Array.isArray(data) ? data : [data];
              return posts.flatMap((post: Post) => post.keywords || []);
            } else {
              console.error(`Error fetching from ${endpoint}`);
              return [];
            }
          })
        );

        const combinedKeywords = [...new Set(responses.flat())];
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
    return <div className="placeholder">Loading Keywords...</div>;
  }

  return (
    <div className="home-container">
      <Helmet>
        <meta name="keywords" content={allKeywords.join(', ')} />
        <title>Bright Lights Creative</title>
      </Helmet>
      <Suspense fallback={<div className="placeholder">Loading Top...</div>}>
      <UniversalContainer type="about" direction="ltr" navigateTo="/about" />
      </Suspense>
      <Suspense fallback={<div className="placeholder">Loading Middle...</div>}>
        <BulletContainer keywords={allKeywords} onKeywordsChange={handleBulletKeywordsChange} />
      </Suspense>
      <Suspense fallback={<div className="placeholder">Loading Web 3...</div>}>
      <UniversalContainer type="web3" direction="rtl" navigateTo="/web3" />
      </Suspense>
      <Suspense fallback={<div className="placeholder">Loading Projects...</div>}>
      <UniversalContainer type="projects" direction="ltr" navigateTo="/projects" />
      </Suspense>
    </div>
  );
}

export default Home;