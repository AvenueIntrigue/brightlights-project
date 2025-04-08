import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import DynamicPost from "./DynamicPost";
import GitHubSvg from "./GitHubSvg";
import "./Portfolio.css";

const Portfolio: React.FC = () => {
  const navigate = useNavigate();

  const handleGitHubNav = () => {
    window.open("https://github.com/AvenueIntrigue", "_blank");
  };

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>Portfolio - Bright Lights Creative</title>
      </Helmet>
      <div className="flex m-0">
        <DynamicPost type="portfolio" />
      </div>
      <div className="w-[80%] mx-auto">
        <div className="PO-button-container flex">
          <button
            type="button"
            className="po-button flex"
            onClick={handleGitHubNav}
          >
            <GitHubSvg />
            <span className="po-button-text">View GitHub Repository</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;