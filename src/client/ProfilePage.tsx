import React from 'react';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import UpdateProfilePhoto from './UpdateProfilePhoto';

const ProfilePage: React.FC = () => {
  return (
    <div>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <h1>Profile Page</h1>
        <UpdateProfilePhoto />
      </SignedIn>
    </div>
  );
};

export default ProfilePage;
