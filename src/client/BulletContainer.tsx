import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useUser, useSession } from '@clerk/clerk-react';
import { fetchAboutUs, fetchBulletContainerContent, updateAboutUs, updateBulletContainerContent } from '../server/api';
import { BulletContainerContent, BulletContainerAboutUs } from '../shared/interfaces';
import './BulletContainer.css';

interface ContainerProps {
  keywords: string[];
  onKeywordsChange: (newKeywords: string[]) => void;
}

interface BulletContainerProps extends ContainerProps {
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
}



const BulletContainer: React.FC<BulletContainerProps> = ({ keywords, onKeywordsChange }) => {
  const { user } = useUser();
  const { session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [bullets, setBullets] = useState<BulletContainerContent[]>([]);
  const [newBullets, setNewBullets] = useState<BulletContainerContent[]>([]);
  const [aboutUs, setAboutUs] = useState('');
  const [newAboutUs, setNewAboutUs] = useState('');
  const [keywordInputs, setKeywordInputs] = useState<string[]>([]);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const fetchedBullets = await fetchBulletContainerContent();
        const aboutUs = await fetchAboutUs();
        
        console.log('Fetched Bullets:', fetchedBullets);
        console.log('Fetched About Us:', aboutUs);
  
        if (Array.isArray(fetchedBullets) && aboutUs && typeof aboutUs.aboutUs === 'string') {
          setBullets(...[fetchedBullets]);
          setNewBullets(...[fetchedBullets]);
          setAboutUs(aboutUs.aboutUs);
          setNewAboutUs(aboutUs.aboutUs);
          setKeywordInputs(fetchedBullets.map(() => ''));
        } else {
          console.error('Fetched content does not have the expected structure.');
        }
      } catch (error) {
        console.error('Failed to load bullet container content:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadContent();
  }, [isEditing]);
  

  const handleBulletKeywordChange = (index: number, updatedKeywords: string[]) => {
    const updatedBullets = [...newBullets];
    updatedBullets[index].keywords = updatedKeywords;
    setNewBullets(updatedBullets);
  };
  
  const handleInputChange = (index: number, value: string) => {
    // Convert comma-separated string to array
    const keywordsArray = value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
    handleBulletKeywordChange(index, keywordsArray);
  };
  
  
  

  const handleBulletKeywordBlur = (
    event: React.FocusEvent<HTMLInputElement>, 
    index: number
  ) => {
    const inputValue = event.target.value;
    if (inputValue) {
      const keywordsArray = inputValue.split(',').map((keyword) => keyword.trim());
      const validKeywords = keywordsArray.filter((keyword) => keyword !== '');
  
      setBullets((prevBullets) => {
        const updatedBullets = [...prevBullets];
        updatedBullets[index].keywords = [...updatedBullets[index].keywords, ...validKeywords];
        return updatedBullets;
      });
    }
  };
  
  
  

  const handleKeywordInputChange = (index: number, value: string) => {
    const updatedKeywordInputs = [...keywordInputs];
    updatedKeywordInputs[index] = value;
    setKeywordInputs(updatedKeywordInputs);
  };

  const addBulletKeyword = (index: number) => {
    if (keywordInputs[index].trim()) {
      const updatedKeywords = [...(newBullets[index].keywords || []), keywordInputs[index].trim()];
      handleBulletKeywordChange(index, updatedKeywords); // Now this works
      handleKeywordInputChange(index, ''); // Clear the input after adding the keyword
    }
  };
  

  const removeBulletKeyword = (bulletIndex: number, keywordIndex: number) => {
    const updatedKeywords = newBullets[bulletIndex].keywords.filter((_, i) => i !== keywordIndex);
    handleBulletKeywordChange(bulletIndex, updatedKeywords);
  };

  const clearBulletKeywords = (index: number) => {
    handleBulletKeywordChange(index, []);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setNewBullets(bullets);
    setNewAboutUs(aboutUs);
    setKeywordInputs(bullets.map(() => ''));
  };

  const handleSaveClick = async () => {
    if (!user || !session) {
      console.error('User is not logged in or session is not available.');
      return;
    }

    const publicMetadata = user.publicMetadata as { permissions?: string[] };
    const hasPermission = publicMetadata.permissions?.includes('edit:content');

    if (!hasPermission) {
      console.error('User does not have permission to edit content.');
      return;
    }

    try {
      const token = await session?.getToken() ?? '';
      if (!token) {
        console.error('Failed to get session token.');
        return;
      }
      
      const updatedContent = await updateBulletContainerContent({bullets: newBullets}, token);
      const updatedAboutUs = await updateAboutUs(newAboutUs, token);
      setBullets(updatedContent.bullets);
      setNewBullets(updatedContent.bullets);
      setAboutUs(updatedAboutUs.aboutUs);
      setNewAboutUs(updatedAboutUs.aboutUs);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update bullet container content', error);
    }
  };

  const handleBulletChange = <K extends keyof BulletContainerContent>(
    index: number,
    field: K,
    value: BulletContainerContent[K] | File | null
  ) => {
    if (value === null) return;
    const updatedBullets = [...newBullets];
    if (field === 'image' && value instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatedBullets[index][field] = reader.result as BulletContainerContent[K];
        setNewBullets(updatedBullets);
      };
      reader.readAsDataURL(value);
    } else {
      updatedBullets[index][field] = value as BulletContainerContent[K];
      setNewBullets(updatedBullets);
    }
  };

  return (
    <div className='bullet-container-grand'>
     <Helmet>
  <meta 
    name="keywords" 
    content={
      [...keywords, ...(Array.isArray(newBullets) ? newBullets.flatMap(bullet => bullet.keywords || []) : [])].join(', ')
    } 
  />
</Helmet>

      <hr className='line-bullet' />
      <div className="bullet-container">
        <div className="bullet-container-text w-full px-10">
          {isEditing ? (
            <input
              type="text"
              className="about-us-input"
              value={newAboutUs}
              onChange={(e) => setNewAboutUs(e.target.value)}
              placeholder="About Us"
            />
          ) : (
            <h1 className="about-us text-left">{aboutUs}</h1>
          )}
        </div>

        {isEditing ? (
          newBullets?.map((bullet, index) => (
            <div key={index} className="bullet-item">
              <input
                type="text"
                placeholder="Title"
                value={bullet.title}
                onChange={(e) => handleBulletChange(index, 'title', e.target.value)}
              />
              <textarea
                className="w-full h-32 p-2 border"
                placeholder="Description"
                value={bullet.description}
                onChange={(e) => handleBulletChange(index, 'description', e.target.value)}
              />
              <input
                type="file"
                onChange={(e) => handleBulletChange(index, 'image', e.target.files ? e.target.files[0] : null)}
              />
              <input
                type="text"
                placeholder="Image Alt Text"
                value={bullet.imageAlt}
                onChange={(e) => handleBulletChange(index, 'imageAlt', e.target.value)}
              />

              {/* Keywords Management */}
              <input
  type="text"
  value={bullet.keywords.join(', ')}
  onChange={(e) => handleInputChange(index, e.target.value)}
  onBlur={(e) => handleBulletKeywordBlur(e, index)}
  placeholder="Add keywords separated by commas"
/>


              <button onClick={() => addBulletKeyword(index)}>Add Keyword</button>
              <button onClick={() => clearBulletKeywords(index)}>Clear All Keywords</button>
              <div className="keywords-list">
                {(bullet.keywords || []).map((keyword, keywordIndex) => (
                  <span key={keywordIndex} className="keyword">
                    {keyword}
                    <button onClick={() => removeBulletKeyword(index, keywordIndex)} className="remove-button">x</button>
                  </span>
                ))}
              </div>
            </div>
          ))
        ) : (
          bullets?.map((bullet, index) => (
            <div key={index} className="bullet-item">
              <img className="rounded-full w-72 p-14" src={bullet.image} alt={bullet.imageAlt} />
              <h2 className='bullet-title'>{bullet.title}</h2>
              
              <p className='bullet-description'>{bullet.description}</p>
              <div className="keywords-list">
                {(bullet.keywords || []).map((keyword, keywordIndex) => (
                  <span key={keywordIndex} className="keyword">{keyword}</span>
                ))}
              </div>
            </div>
          ))
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
  );
};

export default BulletContainer;