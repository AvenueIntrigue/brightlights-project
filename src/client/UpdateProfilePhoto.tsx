import React, { useState } from 'react';
import { useUser, useSession } from '@clerk/clerk-react';

const UpdateProfilePhoto: React.FC = () => {
  const { user } = useUser();
  const { session } = useSession();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleUpload = async () => {
    if (!user || !session) return;
  
    setIsUploading(true);
  
    try {
      console.log('Getting token...');
      const token = await session.getToken();
  
      if (!token) {
        console.error('Failed to retrieve token.');
        return;
      }
  
      console.log('Token retrieved:', token);
  
      let response;
  
      if (imageFile) {
        console.log('Uploading image file...');
        const formData = new FormData();
        formData.append('file', imageFile);
  
        response = await fetch(`https://api.clerk.dev/v1/users/${user.id}/profile_image`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
          mode: 'no-cors'
        });
      } else if (imageUrl) {
        console.log('Updating image URL...');
        response = await fetch(`https://api.clerk.dev/v1/users/${user.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile_image_url: imageUrl }),
          mode: 'no-cors'
        });
      } else {
        console.error('No image file or URL provided.');
        return;
      }
  
      console.log('Response:', response);
  
      if (response.ok) {
        console.log('Profile photo updated successfully');
      } else {
        console.error('Failed to update profile photo');
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2>Update Profile Photo</h2>
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="Or enter an image URL"
        value={imageUrl}
        onChange={handleUrlChange}
      />
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default UpdateProfilePhoto;
