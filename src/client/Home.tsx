import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MiddleContainer from "./MiddleContainer";
import TopContainer from "./TopContainer";
import './Home.css';
import BulletContainer from './BulletContainer';
import Web3Container from './Web3Container';


interface Post {
  title: string;
  description: string;
  images: Array<{ url: string, alt: string }>;
  page: string;
  createdOn: string;
  keywords?: string[];
}

function Home() {
  // Centralized keyword state for all containers
  const [topKeywords, setTopKeywords] = useState<string[]>(['top-keyword1', 'top-keyword2']);
  const [middleKeywords, setMiddleKeywords] = useState<string[]>(['middle-keyword1', 'middle-keyword2']);
  const [bulletKeywords, setBulletKeywords] = useState<string[]>(['bullet-keyword1', 'bullet-keyword2']);
  // Assuming web3 keywords are now managed externally
  const [web3Content, setWeb3Content] = useState<Post | null>(null); // Use Post interface here

  // Combine all keywords into a single array
  const allKeywords = [...(web3Content?.keywords || [])];


  // Handlers to update keywords from child components
  const handleTopKeywordsChange = (newKeywords: string[]) => setTopKeywords(newKeywords);
  const handleMiddleKeywordsChange = (newKeywords: string[]) => setMiddleKeywords(newKeywords);
  const handleBulletKeywordsChange = (newKeywords: string[]) => setBulletKeywords(newKeywords);
  // Remove handleWeb3KeywordsChange since it's now managed externally

  return (
    <div className="home-container">
      <Helmet>
        <meta name="keywords" content={allKeywords.join(', ')} />
        {/* Add additional meta tags here */}
      </Helmet>
      <TopContainer keywords={topKeywords} onKeywordsChange={handleTopKeywordsChange} />
      <MiddleContainer keywords={middleKeywords} onKeywordsChange={handleMiddleKeywordsChange} />
      <BulletContainer keywords={bulletKeywords} onKeywordsChange={handleBulletKeywordsChange} />
      <Web3Container type=''/>
    </div>
  );
}

export default Home;