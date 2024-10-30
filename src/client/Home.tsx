import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import MiddleContainer from "./MiddleContainer";
import TopContainer from "./TopContainer";
import './Home.css';
import BulletContainer from './BulletContainer';
import Web3Container from './Web3Container';



function Home() {

  

  // Centralized keyword state for all containers
  const [topKeywords, setTopKeywords] = useState<string[]>(['top-keyword1', 'top-keyword2']);
  const [middleKeywords, setMiddleKeywords] = useState<string[]>(['middle-keyword1', 'middle-keyword2']);
  const [bulletKeywords, setBulletKeywords] = useState<string[]>(['bullet-keyword1', 'bullet-keyword2']);
  const [web3Keywords, setWeb3Keywords] = useState<string[]>(['web3-keyword1', 'web3-keyword2']);

  // Combine all keywords into a single array
  const allKeywords = [...topKeywords, ...middleKeywords, ...bulletKeywords, ...web3Keywords];

    // Handlers to update keywords from child components
    const handleTopKeywordsChange = (newKeywords: string[]) => setTopKeywords(newKeywords);
    const handleMiddleKeywordsChange = (newKeywords: string[]) => setMiddleKeywords(newKeywords);
    const handleBulletKeywordsChange = (newKeywords: string[]) => setBulletKeywords(newKeywords);
    const handleWeb3KeywordsChange = (newKeywords: string[]) => setWeb3Keywords(newKeywords);
  

    return (
        <div className="home-container">
             <Helmet>
             <meta name="keywords" content={allKeywords.join(', ')} />
        {/* Add additional meta tags here */}
      </Helmet>
            <TopContainer
            keywords={topKeywords}
            onKeywordsChange={handleTopKeywordsChange} />
            <MiddleContainer
             keywords={middleKeywords}
             onKeywordsChange={handleMiddleKeywordsChange} />
            <BulletContainer
            keywords={bulletKeywords}
            onKeywordsChange={handleBulletKeywordsChange}  />
            <Web3Container
            keywords={web3Keywords}
            onKeywordsChange={handleWeb3KeywordsChange}  />
        </div>
    );
}

export default Home;
