// DescriptionEditor.tsx


import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import FontFamily from '@tiptap/extension-font-family';
import Underlines from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import extLink from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import Paragraph from '@tiptap/extension-paragraph';
import YouTube, { Youtube } from '@tiptap/extension-youtube';
import { FontSize } from './FontSize';
import { availableAdobeFonts } from './Fonts';

import { Bold, Heading, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseSensitive, ImageIcon, Strikethrough, Clapperboard, MessageSquareQuote, Link, List, Plus, Divide, Check} from 'lucide-react';



  interface DescriptionEditorProps {

    setEditorTwo: (editor: any) => void;

  }



  const DescriptionEditor: React.FC<DescriptionEditorProps> = ({setEditorTwo}) => {

    const [activeAlignment, setActiveAlignment] = useState<'left' | 'center' | 'right' | 'justify' | ''>('');
    const [ isFontDropdownOpen, setIsFontDropdownOpen ] = useState(false);
    const [ isFontSizeDropdownOpen, setIsFontSizeDropdownOpen ] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const availableFontSizes = ['12', '14', '16', '18', '20', '24', '30', '36', '48', '64', '72', '96', '144', '288'];
    const availableFontFamilies = ['Arial', 'Georgia', 'Times New Roman', 'Verdana'];
    const [selectedFontSize, setSelectedFontSize] = useState<string>('16');
    const [focusedField, setFocusedField] = useState('');

  


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

    // Pass the editor instance back to CreateBlog.tsx
    useEffect(() => {
        if (editorTwo) {
          setEditorTwo(editorTwo);
        }
      }, [editorTwo, setEditorTwo]);

        // Ref for the font size dropdown
  const fontSizeDropdownRef = useRef<HTMLSelectElement>(null);

  const openFontSizeDropdown = () => {
    if (fontSizeDropdownRef.current) {
      fontSizeDropdownRef.current.focus(); // Focus the dropdown to auto-open it
      fontSizeDropdownRef.current.click(); // Programmatically trigger a click to open
    }
  };

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = event.target.value;
    setSelectedFontSize(newSize);

    // Apply the selected font size using the editor command
    if (editorTwo) {
      editorTwo.commands.setFontSize(newSize);
    }
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

  const selectFontFamily = (fontFamily: string) => {
    editorTwo?.chain().focus().setFontFamily(fontFamily).run();
    setIsFontDropdownOpen(false); // Close the dropdown after selecting a font
  };

  if (!editorTwo) {
    return null;
  }

  const toggleFontDropdown = () => {
    setIsFontDropdownOpen(!isFontDropdownOpen);
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

  const insertImageURL = () => {
    const url = prompt('Enter the image URL:');
    if (url) {
      editorTwo?.chain().focus().setContent(`<img src="${url}" alt="Image"/>`).run();
    }
  };




  return(


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

    </div>

  



  );

}

export default DescriptionEditor;