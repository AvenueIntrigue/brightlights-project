import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useUser, useSession } from '@clerk/clerk-react';
import { fetchTopContainerContent } from '../server/api';
import { SkeletonImage, SkeletonText } from './SkeletonComponent';
import './TopContainer.css';


interface PublicMetadata {
  permissions?: string[];
}
interface ContainerProps {
  keywords: string[];
  onKeywordsChange: (newKeywords: string[]) => void;
}

interface TopContainerContentProps extends ContainerProps {
  initialKeywords?: string[];
}

const TopContainer: React.FC<TopContainerContentProps> = ({ initialKeywords = [] }) => {
  const { user } = useUser();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [image, setImage] = useState<string>('');
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState<string>('');
  const [newImageAlt, setNewImageAlt] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>(initialKeywords || []);
  const [inputValue, setInputValue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [newTitle, setNewTitle] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Choose File');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const { image, imageAlt, title, description, keywords } = await fetchTopContainerContent();
        setImage(image);
        setNewImage(image);
        setImageAlt(imageAlt);
        setNewImageAlt(imageAlt);
        setTitle(title);
        setNewTitle(title);
        setDescription(description);
        setNewDescription(description);
        setKeywords(keywords || []);  // Ensure keywords is an array
      } catch (error) {
        console.error('Failed to load top container content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    if (inputValue.trim()) {
      const newKeywords = inputValue
        .split(',')
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword !== '');
      setKeywords([...keywords, ...newKeywords]);
      setInputValue('');
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const clearKeywords = () => {
    setKeywords([]);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setNewTitle(title);
    setNewDescription(description);
    setNewImageAlt(imageAlt);
    setNewImage(null);
    setFileName('Choose File');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImage(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        body: formData,
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
      const response = await fetch('http://localhost:3000/api/topcontainer', {
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
        setImageAlt(updatedContent.imageAlt);
        setTitle(updatedContent.title);
        setDescription(updatedContent.description);
        setKeywords(updatedContent.keywords || []);
        setIsEditing(false);
      } else {
        console.error('Failed to update top container content');
      }
    } catch (error) {
      console.error('Error updating top container content:', error);
    }
  };

  return (
    <div className='top-container-grand pt-[7%]'>
      <Helmet>
        {keywords && keywords.length > 0 && (
          <meta name="keywords" content={keywords.join(', ')} />
        )}
      </Helmet>
      
      <hr className='line-top' />
      <div className="top-container">
        <div className='tp-container'>
        <div className='top-img-container'>
          {isLoading ? <SkeletonImage /> : <img className="top-image" src={image} alt={imageAlt} />}
          {isEditing && (
            <div>
              <input
                className='file-input'
                ref={fileInputRef}
                id="image-upload"
                type="file"
                onChange={handleFileChange}
              />
              <button
                className="custom-file-button"
                onClick={() => fileInputRef.current?.click()}
              >
                {fileName}
              </button>
              <input className='w-full h-10 p-2 border' id='image-alt' placeholder='Image Alt' type="text" value={newImageAlt} onChange={(e) => setNewImageAlt(e.target.value)} />
            </div>
          )}
        </div>
        </div>
        
        <div className="top-container-text">
          {isLoading ? (
            <>
              <SkeletonText short />
              <SkeletonText />
            </>
          ) : isEditing ? (
            <div>
              <input
                placeholder='Title'
                id='title'
                className='w-full h-10 p-2 border'
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <textarea
                placeholder='Description'
                className="w-full h-32 p-2 border"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <input
                type="text"
                id='keywords'
                className='w-full h-10 p-2 border'
                value={inputValue}
                placeholder='Add Keyword. If multiple, separate with commas.'
                onChange={handleInputChange}
                onBlur={handleInputBlur}
              />
              <div className="keywords-list">
                {(keywords || []).map((keyword, index) => (
                  <span key={index} className="keyword">
                    {keyword}
                    <button onClick={() => removeKeyword(index)} className="remove-button">x</button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h1 className='top-about-us p-2 text-right'>{title}</h1>
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

export default TopContainer;
