import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import BlogPage from "./BlogPage";
import BlogPost from "./BlogPost";
import EmailForm from "./Contact";
import Footer from "./Footer";
import Header from "./Header";
import CreateBlog from "./CreateBlog";
import PrivateRoute from "./PrivateRoute";
import CreatePricing from "./Create";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import ProfilePage from "./ProfilePage";
import DynamicPost from "./DynamicPost";
import Portfolio from "./Portfolio";
const App: React.FC = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<EmailForm />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        {/* Dynamic routing for Pricing, About, and Services */}
        <Route path="/pricing" element={<DynamicPost type="pricing" />} />
        <Route path="/about" element={<DynamicPost type="about" />} />
        <Route path="/services" element={<DynamicPost type="services" />} />
        <Route
          path="/web-development"
          element={<DynamicPost type="web-development" />}
        />
        <Route
          path="/app-development"
          element={<DynamicPost type="app-development" />}
        />
        <Route
          path="/graphic-design"
          element={<DynamicPost type="graphic-design" />}
        />
        <Route path="/web3" element={<DynamicPost type="web3" />} />
        <Route path="/projects" element={<DynamicPost type="projects" />} />
        <Route path="/portfolio" element={<Portfolio type="portfolio" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/create"
          element={
            <SignedIn>
              <CreatePricing />
            </SignedIn>
          }
        />
        <Route
          path="/create-about"
          element={
            <SignedIn>
              <CreatePricing />
            </SignedIn>
          }
        />
        <Route
          path="/create-blog"
          element={
            <SignedIn>
              <CreateBlog />
            </SignedIn>
          }
        />

        {/* Redirect unauthenticated users */}
        <Route
          path="/create-blog"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;
