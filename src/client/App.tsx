import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/clerk-react";
import { Helmet } from "react-helmet-async";
import { SignIn, SignUp } from "@clerk/clerk-react";

import Home from "./Home";
import BlogPage from "./BlogPage";
import BlogPost from "./BlogPost";
import EmailForm from "./Contact";
import Footer from "./Footer";
import Header from "./Header";
import CreateBlog from "./CreateBlog";
import Create from "./Create";
import ProfilePage from "./ProfilePage";
import DynamicPost from "./DynamicPost";
import Portfolio from "./Portfolio";
import BibleLessonsForm from "./BibleLessonsForm";
import MusicAlbumForm from "./MusicAlbumForm";
import AddTrackToAlbumForm from "./AddTrackToAlbumForm";
import VideoForm from "./VideoForm";
import VideoAdmin from "./VideoAdmin";

// Basic signed-in protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => (
  <>
    <SignedIn>{children}</SignedIn>
    <SignedOut>
      <RedirectToSignIn />
    </SignedOut>
  </>
);

// Admin-only protection (checks Clerk publicMetadata.role === "Admin")
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoaded } = useUser();

  // Avoid flashing the wrong UI while Clerk loads
  if (!isLoaded) return null; // or return a spinner component

  const isAdmin = user?.publicMetadata?.role === "Admin";

  return (
    <>
      <SignedIn>{isAdmin ? children : <Navigate to="/" replace />}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const App: React.FC = () => {
  return (
    <div>
      <Helmet>
        <meta
          name="google-site-verification"
          content="googlefd09adf64001cc42.html"
        />
        <meta name="msvalidate.01" content="747DB8DFF5B596B36E56160A4BF8CB35" />
      </Helmet>

      <Header />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<EmailForm />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogPost />} />

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
        <Route path="/portfolio" element={<Portfolio />} />

        {/* Clerk hosted routes */}
        <Route
          path="/sign-in"
          element={<SignIn routing="path" path="/sign-in" />}
        />
        <Route
          path="/sign-up"
          element={<SignUp routing="path" path="/sign-up" />}
        />

        {/* Profile (choose whether this should be protected) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/lessons"
          element={
            <AdminRoute>
              <BibleLessonsForm />
            </AdminRoute>
          }
        />

        {/* ================= MUSIC ================= */}

        <Route
          path="/admin/music"
          element={
            <AdminRoute>
              <MusicAlbumForm />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/music/add-track"
          element={
            <AdminRoute>
              <AddTrackToAlbumForm />
            </AdminRoute>
          }
        />
{/* ================= VIDEO ================= */}

<Route
  path="/admin/videos"
  element={
    <AdminRoute>
      <VideoAdmin />
    </AdminRoute>
  }
/>

<Route
  path="/admin/videos/upload"
  element={
    <AdminRoute>
      <VideoForm />
    </AdminRoute>
  }
/>

// Optional future-proof route (later you can build VideoEdit)
{/* <Route
  path="/admin/videos/edit/:videoId"
  element={
    <AdminRoute>
      <VideoForm />
    </AdminRoute>
  }
/> */}
        

        {/* Admin-only create routes */}
        <Route
          path="/create"
          element={
            <AdminRoute>
              <Create />
            </AdminRoute>
          }
        />
        <Route
          path="/create-blog"
          element={
            <AdminRoute>
              <CreateBlog />
            </AdminRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
