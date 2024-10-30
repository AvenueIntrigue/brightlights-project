import React, { useMemo, useEffect, useState, useCallback, FormEvent, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditorContent, isActive, useEditor } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit  from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underlines from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import extLink from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import YouTube, { Youtube } from '@tiptap/extension-youtube';
import { Bold, Heading, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseSensitive, ImageIcon, Strikethrough, Clapperboard, MessageSquareQuote, Link, List, Plus, Divide, Check} from 'lucide-react';
import { useUser, useSession } from '@clerk/clerk-react';
import axios from 'axios';
import '../client/CreateAbout.css';
import Paragraph from '@tiptap/extension-paragraph';
import { availableAdobeFonts } from './Fonts';
import { FontSize } from './FontSize';
import TitleEditor from './TitleEditor';





interface PublicMetadata {
  permissions?: string[];
}

interface Image {
  url: string;
  alt: string;
}

interface CustomDropdownProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  onCategoryRemove: (category: string) => void;
}


type CustomElement = { type: 'paragraph'; children: CustomText[] };
type CustomText = { text: string };

const initialValue: CustomElement[] = [
  { type: 'paragraph', children: [{ text: '' }] },
];




const CreateAbout = () => {

  const CustomDropdown: React.FC<CustomDropdownProps> = ({
    categories,
    selectedCategory,
    onCategorySelect,
    onCategoryRemove,
  }) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false); // State to toggle new category input field
    const [newCategory, setNewCategory] = useState(''); // State to hold new category input
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
  
    const handleDropdownToggle = () => {
      setIsDropdownVisible(!isDropdownVisible);
    };
  
    const handleCategoryClick = (category: string) => {
      if (category === 'Add New Category') {
        setShowNewCategoryInput(true); // Show the input field
      } else {
        onCategorySelect(category);
        setIsDropdownVisible(false); // Close dropdown when category is selected
      }
    };
  
    const handleAddNewCategory = () => {
      if (newCategory.trim()) {
        onCategorySelect(newCategory); // Add and select the new category
        setShowNewCategoryInput(false); // Hide input field after adding
        setNewCategory(''); // Clear the input field
        setIsDropdownVisible(false); // Close dropdown
      }
    };
  
    const handleClickOutside = (event: MouseEvent) => {
      const targetElement = event.target as HTMLElement | null;
      if (
        dropdownRef.current &&
        inputRef.current &&
        targetElement &&
        !dropdownRef.current.contains(targetElement) &&
        !inputRef.current.contains(targetElement)
      ) {
        setIsDropdownVisible(false);
      }
    };
  
    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

  
  
    return (
      <div className="custom-dropdown h-10" ref={dropdownRef} onClick={handleDropdownToggle}>
        <div className="dropdown-selected block w-full">
          {showNewCategoryInput ? (
            <div className="input-button-div flex flex-row">
              <div className='add-new-input-container'>
              <input
                type="text"
                className="add-new-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Add New Category"
                ref={inputRef}
              />
              </div>
              <div className='add-new-button-container'>
              <a
                type="button"
                onClick={handleAddNewCategory}
                className="add-new-button"
              >
                <Plus/>
              </a>
              </div>
            </div>
          ) : 
          selectedCategory ? (
            selectedCategory
          ) : (
            <span className="category-placeholder">Category</span>
          )}
          
        </div>
        {isDropdownVisible && (
          <div className="custom-menu dropdown-menu left-0 w-[33%] rounded-xl">
            {!showNewCategoryInput ? (
              <>
                {categories.map((cat) => (
                  <div key={cat} className="cat-sect">
                    <div className="dropdown-item">
                      <button className="remove-category w-[10%] mr-3" onClick={() => onCategoryRemove(cat)}>
                        x
                      </button>
                      <span onClick={() => handleCategoryClick(cat)}>{cat}</span>
                    </div>
                  </div>
                ))}
                <button className="addnew mx-auto" onClick={() => handleCategoryClick('Add New Category')}>
                  Add New Category
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };
  
  
  const [categories, setCategories] = useState<string[]>([
   'Nature', 'Travel', 'Technology', 'Politics', 'Religion',
  ]); 

  const availableFontSizes = ['12', '14', '16', '18', '20', '24', '30', '36', '48' ,'64', '72', '96', '144', '288'];

  const [selectedFontSize, setSelectedFontSize] = useState<string>('16');

  

    // Ref for the font size dropdown
    const fontSizeDropdownRef = useRef<HTMLSelectElement>(null);


  const navigate = useNavigate();

  const editorTwo = useEditor({
    extensions: [ StarterKit, TextStyle, 
      
      
      FontFamily.configure({
        types: ['textStyle'],

      }), TextAlign.configure({
    types: ['heading', 'paragraph'], 
    }),
    extLink.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      
  validate: (href) => /^https?:\/\//.test(href),
  HTMLAttributes: {

    class: 'extlink',
  }


    }),
    Underlines,
    FontSize.configure({
availableFontSizes: availableFontSizes,
      
    }),
    Image.configure({

      inline: true,
      allowBase64: true,

    }),
    
    Youtube.configure({

      modestBranding: true,
      allowFullscreen: true,
      nocookie: true,
      width: 640,
      height: 480,
    }),
    
  


    
  ],
    content: '<p></p>',
  });

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = event.target.value;
    setSelectedFontSize(newSize);

    // Apply the selected font size using the editor command
    if (editorTwo) {
      editorTwo.commands.setFontSize(newSize);
    }
  };


    // Function to auto-open font size dropdown
    const openFontSizeDropdown = () => {
      if (fontSizeDropdownRef.current) {
        fontSizeDropdownRef.current.focus(); // Focus the dropdown to auto-open it
        fontSizeDropdownRef.current.click(); // Programmatically trigger a click to open
      }
    };



  
  const { user } = useUser();
  const { session } = useSession();
  const [title, setTitle] = useState('');
  const [ editorOne, setEditorOne ] = useState<any>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState('');
  const [fileName, setFileName] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isCancelTriggered, setIsCancelTriggered] = useState(false);
  const [ inputValue, setInputValue ] = useState('')
  const [ keywords, setKeywords] = useState<string[]>([]);
  const [ currentKeyword, setCurrentKeyword ] = useState('');
  const [isFocused, setIsFocused] = useState(false); // State to track focus
  const [ isFontDropdownOpen, setIsFontDropdownOpen ] = useState(false);
  const [ isFontSizeDropdownOpen, setIsFontSizeDropdownOpen ] = useState(false);
  const [activeAlignment, setActiveAlignment] = useState<'left' | 'center' | 'right' | 'justify' | ''>('');
  const [height, setHeight] = React.useState(480);
  const [width, setWidth] = React.useState(640);




  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };


  const toggleFontDropdown = () => {
    setIsFontDropdownOpen(!isFontDropdownOpen);
  };

  

  const selectFontFamily = (fontFamily: string) => {
    editorTwo?.chain().focus().setFontFamily(fontFamily).run();
    setIsFontDropdownOpen(false); // Close the dropdown after selecting a font
  };

  if (!editorTwo) {
    return null;
  }



  const toggleFontSizeDropdown = () => {
    setIsFontSizeDropdownOpen(!isFontSizeDropdownOpen);
    openFontSizeDropdown();
  };



  const handleAlignmentClick = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editorTwo?.chain().focus().setTextAlign(alignment).run();
    setActiveAlignment(alignment);
  };

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL');
  
    if (url) {
      editorTwo?.commands.setYoutubeVideo({
        src: url,
        width: 640,  // you can adjust these values as needed
        height: 480,
      });
    }
  };

  const setLink = useCallback(() => {
    const previousUrl = editorTwo?.getAttributes('link').href || '';
    const url = window.prompt('Enter the URL', previousUrl);
  
    if (url === null) {
      return;
    }
  
    if (url === '') {
      editorTwo?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
  
    editorTwo?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editorTwo]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories(prev => [...prev, newCategory]);
      setCategory(newCategory);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(prev => prev.filter(cat => cat !== categoryToRemove));
    if (category === categoryToRemove) {
      setCategory('');
    }
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    if (selectedCategory === 'Add New Category') {
      setShowNewCategoryInput(true);
    } else {
      setShowNewCategoryInput(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setCategory(value);
  
    // Show the input field only if the "Add New Category" option is selected
    if (value === "Add New Category") {
      setShowNewCategoryInput(true);
    } else {
      setShowNewCategoryInput(false);
    }
  };
  

  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategory(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle pressing Enter to submit keywords
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addKeywords();
    }
  };

  // Handle input blur (when the user clicks outside of the input)
  const handleBlur = () => {
    addKeywords();
  };

  // Function to add keywords
  const addKeywords = () => {
    const newKeywords = inputValue
      .split(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== '');

    setKeywords((prevKeywords) => [...prevKeywords, ...newKeywords]); // Add new keywords to the array
    setInputValue(''); // Clear input field after adding
  };

  // Remove a keyword
  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords((prevKeywords) => prevKeywords.filter((keyword) => keyword !== keywordToDelete));
  };

  // Clear all keywords
  const handleClearAllKeywords = () => {
    setKeywords([]); // Clear all keywords
  };




 
  
  

  const uploadImage = async (file: File, alt: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      setImages((prevImages) => [
        ...prevImages,
        { url: response.data.secure_url, alt }
      ]);
    } catch (error) {
      console.error('Error uploading image', error);
    }
  };


  const handleAltChange = (index: number, newAlt: string) => {
    const newImages = [...images];
    newImages[index].alt = newAlt;
    setImages(newImages);
  };

  const handleCancelImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImagePreview('');
    setIsImageUploaded(false);
    setFileName('Image URL');
    setIsCancelTriggered(true);
  };

const uploadImageToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET); // Replace with your Cloudinary upload preset

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    console.error('Error uploading image to Cloudinary', error);
    throw new Error('Image upload failed');
  }
};

const insertImageURL = () => {
  const url = prompt('Enter the image URL:');
  if (url) {
    editorTwo?.chain().focus().setContent(`<img src="${url}" alt="Image"/>`).run();
  }
};

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    if (!user) {
      console.error('User is not defined.');
      return;
    }

    const publicMetadata = user.publicMetadata as PublicMetadata;
    const hasPermission = publicMetadata.permissions?.includes('create:about_post');

    if (!hasPermission) {
      console.error('User does not have permission to create about posts.');
      return;
    }

    const token = await session?.getToken();

    if (!token) {
      console.error('Failed to retrieve token');
      return;
    }

    

    const newPost = {
      title: editorOne?.getHTML(),
      description: editorTwo?.getHTML(),
      images,
      category: showNewCategoryInput ? newCategory : category,
      keywords: keywords,
      createdOn: new Date(),
      
    };

    

    const response = await fetch('http://localhost:3000/api/aboutposts', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newPost),
    });

    if (response.ok) {
      const data = await response.json();
      navigate(`/about`);
    } else {
      const errorDetails = await response.json();
      console.error('Error creating about post', response.statusText, errorDetails);
    }
  } catch (error: any) {
    console.error('Error creating about post', error.message);
  }
};


  
  
  

  return (
    <div className="create-blog-container mx-auto">
      <form className="create-blog" onSubmit={handleSubmit}>
        <div className="form-container">
          <h1 className="form-box-text">Create About Post</h1>
        </div>
        <div className="form-content">
          <div className="pt-[1%]">
            
            <TitleEditor onTitleChange={(newTitle) => setTitle(newTitle)} initialTitle={title} setEditorOne={setEditorOne}/>
            
            
            <div className="input-field relative">
              
          <CustomDropdown
            categories={categories}
            selectedCategory={category}
            onCategorySelect={handleCategorySelect}
            onCategoryRemove={handleRemoveCategory}
          />
         
        </div>

            <div className="input-field mb-4 relative">
              {isImageUploaded && (
                <div className="image-preview-container">
                  <img
                    src={imagePreview}
                    alt="Image Preview"
                    className="w-[50px] h-[50px] object-cover rounded-full mr-2"
                  />




                </div>

              )}
              {!fileName && focusedField !== 'imageURL' && (
                <label className="block pt-1 pl-5">Image URL:   (1/1 Aspect Ratio)</label>
              )}
              {fileName && (
                <label className="block pt-1 pl-5">{fileName}</label>
              )}
              <div className="file-input-wrapper">
                <input
                  type="file"
                  className="file-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const alt = prompt('Enter alt text for the image:');
                      if (alt) {
                        uploadImage(e.target.files[0], alt);
                      }
                    }
                  }}
                  required
                  onFocus={() => setFocusedField('imageURL')}
                  onBlur={() => setFocusedField('')}
                />
                <div className="custom-file-label">Choose file</div>
              </div>
            </div>

            <div className="input-field">
              {images.map((image, index) => (
                <div key={index} className="image-preview-container">
                  <div className='image-cancel'>
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="image-preview"
                  />

                  <button
                    className="cancel-button"
                    onClick={() => handleCancelImage(index)}
                  >
                    x
                  </button>
                  </div>
                  <input
                    type="text"
                    className="image-alt-text"
                    placeholder="Alt text"
                    value={image.alt}
                    onChange={(e) => handleAltChange(index, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="mb-4 relative">
  {!editorTwo?.getHTML().trim() && focusedField !== 'description' && (
    <label className="block pt-1 pl-5">Description</label>
  )}
  
  <div className='toolbar'>
    <button type='button' onClick={()=> editorTwo?.chain().focus().toggleBold().run()} className={`toolbar-button ${editorTwo?.isActive('bold') ? 'is-active' : ''}`}><Bold /></button>
    <button type='button' onClick={()=> editorTwo?.chain().focus().toggleItalic().run()} className={`toolbar-button ${editorTwo?.isActive('italic') ? 'is-active' : ''}`}><Italic/></button>
    <button type='button' onClick={()=> editorTwo?.chain().focus().toggleUnderline().run()} className={`toolbar-button ${editorTwo?.isActive('underlines') ? 'is-active' : ''}`}><Underline/></button>
    <button type='button'  onClick={toggleFontDropdown} className={`toolbar-button ${isFontDropdownOpen ? 'active' : ''}`} >
            <Type/>
          </button>
          {isFontDropdownOpen && (
            <div className="dropdown-menu">
                 {availableAdobeFonts.map((font) => (
                  <div className='dropdown-item'>
      <button type='button'
        key={font.family}
        style={{ fontFamily: font.family, padding: '8px 12px', margin: '4px', display: 'block' }}
        onClick={() => selectFontFamily(font.family)}
      >
        {font.label}
      </button>
      </div>
    ))}
             
            </div>
          )}
          <button type='button'  onClick={toggleFontSizeDropdown} className={`toolbar-button ${isFontSizeDropdownOpen ? 'active' : ''}`}>
            <CaseSensitive/>
          </button>
          {isFontSizeDropdownOpen && (
            
                    <div>
                   

<div className="fontsize-menu">
        <select
          id="font-size-select"
          value={selectedFontSize}
          onChange={handleFontSizeChange}
          ref={fontSizeDropdownRef} // Attach the ref to the select element
        >
          {availableFontSizes.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>
                    </div>
            
          )}
        
        <button type='button' 
          onClick={() => handleAlignmentClick('left')} 
          className={`toolbar-button ${activeAlignment === 'left' ? 'is-active' : ''}`}
        >
          <AlignLeft />
        </button>
        <button type='button'  
          onClick={() => handleAlignmentClick('center')} 
          className={`toolbar-button ${activeAlignment === 'center' ? 'is-active' : ''}`}
        >
          <AlignCenter />
        </button>
        <button type='button'  
          onClick={() => handleAlignmentClick('right')} 
          className={`toolbar-button ${activeAlignment === 'right' ? 'is-active' : ''}`}
        >
          <AlignRight/>
        </button>
        <button type='button'  
          onClick={() => handleAlignmentClick('justify')} 
          className={`toolbar-button ${activeAlignment === 'justify' ? 'is-active' : ''}`}
        >
          <AlignJustify />
        </button>
        <button type='button'  onClick={insertImageURL} className="toolbar-button">
                <ImageIcon />
              </button>
              <button onClick={addYoutubeVideo} className="toolbar-button">
<Clapperboard/>
</button>
<button type='button' 
            onClick={() => editorTwo.chain().focus().toggleBulletList().run()}
            className={`toolbar-button ${editorTwo.isActive('bulletList') ? 'is-active' : ''}`}
          >
            <List />
          </button>
              <button type='button' 
            onClick={() => editorTwo.chain().focus().toggleStrike().run()}
            className={`toolbar-button ${editorTwo.isActive('strike') ? 'is-active' : ''}`}
          >
            <Strikethrough/>
          </button>
          <button type='button' 
            onClick={() => editorTwo.chain().focus().toggleBlockquote().run()}
            className={`toolbar-button ${editorTwo.isActive('blockquote') ? 'is-active' : ''}`}
          >
            <MessageSquareQuote/>
          </button>
          <button type='button' onClick={setLink} className={`toolbar-button ${editorTwo.isActive('link') ? 'is-active' : ''}`}>
            <Link />
          </button>

          
        
        
  </div>
  
  <div className='editor-two'>
      
      <EditorContent editor={editorTwo} />
    </div>
    <div className="keywords-section">
      <div>
        <input
          type="text"
          className="input-field mb-4 relative h-10 border border-gray-500 w-full text-gray-500"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress} // Handle pressing Enter
          onBlur={handleBlur} // Handle when the input loses focus
          placeholder="Enter keywords separated by commas"
        />
      </div>

      {/* Display added keywords */}
      <div className="keyword-list flex flex-wrap mt-2">
        {keywords.map((keyword, index) => (
          <div key={index} className="keyword-chip flex items-center px-2 py-2 mr-2 mb-2 rounded">
            <button onClick={() => handleDeleteKeyword(keyword)} className="keyword-btn">
              x
            </button>
            {keyword}
            
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      {keywords.length > 0 && (
        <button onClick={handleClearAllKeywords} className="clear-all-btn text-red-500 mt-2">
          Clear All Keywords
        </button>
      )}
    </div>

</div>

          </div>
         
         
          <button type="submit" className="submit-button bg-green-200 border-none text-slate-700 h-10 rounded w-full mt-4 mx-auto">
            
            <Check className='mx-auto'/>
            
          </button>
          
        </div>
      </form>
      
    </div>
  );
};


export default CreateAbout;
