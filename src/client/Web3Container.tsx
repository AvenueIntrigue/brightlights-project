import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useUser, useSession } from '@clerk/clerk-react';
import { fetchWeb3ContainerContent } from '../server/api';
import { SkeletonImage, SkeletonText } from './SkeletonComponent';
import './Web3Container.css';

interface PublicMetadata {
  permissions?: string[];
}
interface ContainerProps {
  keywords: string[];
  onKeywordsChange: (newKeywords: string[]) => void;
}

const Web3Container: React.FC<ContainerProps> = () => {
  const { user } = useUser();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>(''); // Ensure imageAlt state is declared
  const [description, setDescription] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywords, setNewKeywords] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImageAlt, setNewImageAlt] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { image, imageAlt, title, description, keywords } = await fetchWeb3ContainerContent();
        setImage(image);
        setImageAlt(imageAlt); // Set imageAlt state here
        setTitle(title);
        setDescription(description);
        setKeywords(keywords || []);
        setNewTitle(title);
        setNewDescription(description);
      } catch (error) {
        console.error('Failed to load web3 container content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);


  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewKeywords(e.target.value);
  };
  
  const addKeyword = () => {
    if (newKeywords.trim()) {
      setKeywords([...keywords, newKeywords.trim()]);
      setNewKeywords('');
    }
  };
  

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setNewTitle(title);
    setNewDescription(description);
    setNewImage(null);
    setNewImageAlt(imageAlt);
  };

  const handleSaveClick = async () => {
    if (!user || !session) {
      console.error('User is not logged in or session is not available.');
      return;
    }

    const publicMetadata = user.publicMetadata as PublicMetadata;
    const hasPermission = publicMetadata.permissions?.includes('edit:content');

    if (!hasPermission) {
      console.error('User does not have permission to edit content.');
      return;
    }

    let imageUrl = image;

    if (newImage) {
      const formData = new FormData();
      formData.append('file', newImage);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        imageUrl = data.secure_url;
      } else {
        console.error('Failed to upload image to Cloudinary');
        return;
      }
    }

    try {
      const token = await session.getToken();
      const response = await fetch('http://localhost:3000/api/web3container', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: imageUrl, imageAlt: newImageAlt, title: newTitle, description: newDescription, keywords }),
      });

      if (response.ok) {
        const updatedContent = await response.json();
        setImage(updatedContent.image);
        setImageAlt(updatedContent.imageAlt); // Update imageAlt state
        setTitle(updatedContent.title);
        setDescription(updatedContent.description);
        setKeywords(updatedContent.keywords);
        setIsEditing(false);
      } else {
        console.error('Failed to update web3 container content');
      }
    } catch (error) {
      console.error('Error updating web3 container content:', error);
    }
  };

  return (
    <div className='web3-container-grand pt-[7%]'>
         <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta property="og:image" content={image} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
      <hr className='line-web3' />
      <div className="web3-container">
        <div className='img-container'>
          {isLoading ? <SkeletonImage /> : <img className="image" src={image} alt={imageAlt} />}
        </div>
        <div>
          {isEditing && (
            <div>
              <input type="file" onChange={(e) => setNewImage(e.target.files ? e.target.files[0] : null)} />
            </div>
          )}
        </div>
        <div className="web3-container-text">
          {isLoading ? (
            <>
              <SkeletonText short />
              <SkeletonText />
            </>
          ) : isEditing ? (
            <div>
              <input
                type="text"
                className='w-full h-10 p-2 border'
                value={newImageAlt}
                placeholder='Image Alt'
                onChange={(e) => setNewImageAlt(e.target.value)}
              />
              <input
                type="text"
                className='w-full h-10 p-2 border'
                value={newTitle}
                placeholder='Title'
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                className="w-full h-32 p-2 border"
                value={newDescription}
                placeholder='Description'
                onChange={(e) => setNewDescription(e.target.value)}
              />
                  <input
              type="text"
              className='w-full h-10 p-2 border'
              value={newKeywords}
              placeholder='Add a keyword'
              onChange={handleKeywordsChange}
            />
            <button onClick={addKeyword}>Add Keyword</button>
            <div className="keywords-list">
              {keywords.map((keyword, index) => (
                <span key={index} className="keyword">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
           
          ) : (
            <div>
              <h1 className='about-us p-2'>{title}</h1>
              <h4>{description}</h4>
            </div>
          )}
          {user && (
            <div className="pt-[7%]">
              {isEditing ? (
                <div>
                  <button className="w-1/4 rounded-md" onClick={handleSaveClick}>Save</button>
                  <button className="w-1/4 rounded-md" onClick={handleCancelClick}>Cancel</button>
                </div>
              ) : (
                <button className="w-1/4 rounded-md" onClick={handleEditClick}>
                  <i className="fa-solid fa-pen-to-square"></i>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Web3Container;
