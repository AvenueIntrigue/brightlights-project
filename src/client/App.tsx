import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from './Home';
import BlogPage from "./BlogPage";
import BlogPost from "./BlogPost";
import EmailForm from "./Contact";
import Footer from "./Footer";
import Header from "./Header";
import CreateBlog from "./CreateBlog";
import PrivateRoute from "./PrivateRoute";
import Create from "./Create";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { Helmet } from "react-helmet-async";
import ProfilePage from "./ProfilePage";
import DynamicPost from "./DynamicPost";
import Portfolio from "./Portfolio";
import BibleLessonsForm from "./BibleLessonsForm";
import MusicTrackForm from "./MusicTrackForm";

const App: React.FC = () => {
  return (
    <div>
      <Helmet>
        <meta name="google-site-verification" content="googlefd09adf64001cc42.html" />
        <meta name="msvalidate.01" content="747DB8DFF5B596B36E56160A4BF8CB35" />
      </Helmet>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<EmailForm />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/pricing" element={<DynamicPost type="pricing" />} />
        <Route path="/about" element={<DynamicPost type="about" />} />
        <Route path="/services" element={<DynamicPost type="services" />} />
        <Route path="/web-development" element={<DynamicPost type="web-development" />} />
        <Route path="/app-development" element={<DynamicPost type="app-development" />} />
        <Route path="/graphic-design" element={<DynamicPost type="graphic-design" />} />
        <Route path="/web3" element={<DynamicPost type="web3" />} />
        <Route path="/projects" element={<DynamicPost type="projects" />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/admin/lessons"
          element={
            <SignedIn>
              <BibleLessonsForm />
            </SignedIn>
          }
        />
        <Route
          path="/admin/lessons"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
          <Route
          path="/admin/music"
          element={
            <SignedIn>
              <MusicTrackForm />
            </SignedIn>
          }
        />
        <Route
          path="/admin/music"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
        <Route
          path="/create"
          element={
            <SignedIn>
              <Create />
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
        <Route
          path="/create-blog"
          element={
            <SignedOut>
              <RedirectToSignIn />
            </SignedOut>
          }
        />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </div>
  );
};

export default App;