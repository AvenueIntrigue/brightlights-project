import React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import "./Footer.css"; // Assuming you have a CSS file for the footer styles
import { SendHorizonal } from "lucide-react";
import XSvg from "./XSvg";
import FBSvg from "./FBSvg";
import GitHubSvg from "./GitHubSvg";
import YTSvg from "./YTSvg";
import UserSvg from "./UserSvg";

function Footer() {
  const today = new Date();
  const year = today.getFullYear();
  const handleContactNav = () => {
    window.location.href = "/contact";
  };

  const handleX = () => {
    window.open("https://x.com/BrightLightsCTV", "_blank");
  };

  const handleFB = () => {
    window.open(
      "https://www.facebook.com/profile.php?id=61574722864247",
      "_blank",
    );
  };

  const handleGitHub = () => {
    window.open("https://github.com/AvenueIntrigue", "_blank");
  };

  const handleYT = () => {
    window.open("https://www.youtube.com/@BrightLightsCTV", "_blank");
  };

  return (
    <div className="footer">
      <div className="footer-container">
        <div className="footer-cu-button-grand">
          <div className="footer-cu-button-container">
            <button onClick={handleContactNav} className="footer-cu-button">
              <div className="footer-cu-button-icon">
                <SendHorizonal />
              </div>
              <span className="footer-cu-button-text">Contact Us</span>
            </button>
          </div>
        </div>
        <div className="footer-icons">
          <div className="footer-icons-container">
            <SignedOut>
              <SignInButton mode="redirect">
                <button
                  type="button"
                  className="sign-in-btn footer-social-icons"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="footer-social-icons">
                <UserButton />
              </div>
            </SignedIn>

            <div className="footer-social-icons">
              <button type="button" onClick={handleX} className="SVG-container">
                <XSvg />
              </button>
            </div>
            <div className="footer-social-icons">
              <button
                type="button"
                onClick={handleFB}
                className="SVG-container"
              >
                <FBSvg />
              </button>
            </div>
            <div className="footer-social-icons">
              <button
                type="button"
                onClick={handleGitHub}
                className="SVG-container"
              >
                <GitHubSvg />
              </button>
            </div>
            <div className="footer-social-icons">
              <button
                type="button"
                onClick={handleYT}
                className="SVG-container"
              >
                <YTSvg />
              </button>
            </div>
          </div>
          <br />
          <br />
        </div>
        <div className="copyright-container">
          <div className="copyright-text">
            Copyright © {year} Bright Lights Creative
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
