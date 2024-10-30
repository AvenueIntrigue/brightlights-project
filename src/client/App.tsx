import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import BlogPage from "./BlogPage";
import BlogPost from "./BlogPost";
import EmailForm from "./Contact";
import Footer from "./Footer";
import Header from "./Header";
import ThankYou from "./ThankYou";
import CreateBlog from "./CreateBlog";
import PrivateRoute from "./PrivateRoute";
import CreatePricing from "./Create";
import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

import ProfilePage from "./ProfilePage";
import DynamicPost from "./DynamicPost";
const App: React.FC = () => {
  return (
    <div>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<EmailForm />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        {/* Dynamic routing for Pricing, About, and Services */}
        <Route path="/pricing" element={<DynamicPost type="pricing" />} />
        <Route path="/about" element={<DynamicPost type="about" />} />
        <Route path="/services" element={<DynamicPost type="services" />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/create" element={<SignedIn><CreatePricing /></SignedIn>}/>
        <Route path="/create-about" element={<SignedIn><CreatePricing /></SignedIn>}/>
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
