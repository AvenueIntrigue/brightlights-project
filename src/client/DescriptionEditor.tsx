// DescriptionEditor.tsx


import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Heading1 from '@tiptap/extension-heading';
import FontFamily from '@tiptap/extension-font-family';
import Underlines from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import extLink from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import { Color } from '@tiptap/extension-color';
import Paragraph from '@tiptap/extension-paragraph';
import YouTube, { Youtube } from '@tiptap/extension-youtube';
import { FontSize } from './FontSize';
import { availableAdobeFonts } from './Fonts';

import { Bold, Heading, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, CaseSensitive, ImageIcon, Strikethrough, Clapperboard, MessageSquareQuote, Link, List, Plus, Divide, Check, Pilcrow} from 'lucide-react';



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
    extensions: [ StarterKit.configure({

      paragraph: false,
      heading: false,
      
    }), TextStyle, Color,
      
      
      FontFamily.configure({
        types: ['textStyle'],

      }), TextAlign.configure({
    types: ['heading', 'paragraph'], 
    

    }),
    extLink.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      protocols: ['ftp', 'mailto', 'tel'],
      
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

    Heading1.configure({

levels: [1,2,3],

    }),


    Paragraph.configure({

      HTMLAttributes: {

        class: 'descriptionParagraph',
        style: 'margin-bottom: 1rem;',
      },

      

     

    }),

    BulletList,

    
    
  


    
  ],
  content: `<p>${"Test paragraph ".repeat(50)}</p>`,
editorProps: {
  attributes: {
    class: 'editor-two', // Custom class for styling
  },
},
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


    <div className="">
    {!editorTwo?.getHTML().trim() && focusedField !== 'description' && (
      <label className="block pt-1 pl-5">Description</label>
    )}
    
    <div className='create-toolbar-bottom'>
      <button type='button' title='Bold' onClick={()=> editorTwo?.chain().focus().toggleBold().run()} className={`create-toolbar-button ${editorTwo?.isActive('bold') ? 'is-active' : ''}`}><Bold /></button>
      <button type='button' title='Italic' onClick={()=> editorTwo?.chain().focus().toggleItalic().run()} className={`create-toolbar-button ${editorTwo?.isActive('italic') ? 'is-active' : ''}`}><Italic/></button>
      <button type='button' title='Underline' onClick={()=> editorTwo?.chain().focus().toggleUnderline().run()} className={`create-toolbar-button ${editorTwo?.isActive('underlines') ? 'is-active' : ''}`}><Underline/></button>
      <button type='button' title='Font-Family'  onClick={toggleFontDropdown} className={`create-toolbar-button ${isFontDropdownOpen ? 'active' : ''}`} >
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
            <button type='button' title='Font Size'  onClick={toggleFontSizeDropdown} className={`create-toolbar-button ${isFontSizeDropdownOpen ? 'active' : ''}`}>
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
                      <button
            onClick={() => editorTwo.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`create-toolbar-button ${editorTwo?.isActive('heading1', { level: 1}) ? 'is-active' : ''}`}
          >
            H1
          </button>
          <button
            onClick={() => editorTwo.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`create-toolbar-button ${editorTwo?.isActive('heading1', { level: 2}) ? 'is-active' : ''}`}
          >
            H2
          </button>
          <button
            onClick={() => editorTwo.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`create-toolbar-button ${editorTwo?.isActive('heading1', { level: 3}) ? 'is-active' : ''}`}
          >
            H3
          </button>
          
          <button type='button' 
          title='Align-Left'
            onClick={() => handleAlignmentClick('left')} 
            className={`create-toolbar-button ${activeAlignment === 'left' ? 'is-active' : ''}`}
          >
            <AlignLeft />
          </button>
          <button type='button'  
            title='Align-Center'
            onClick={() => handleAlignmentClick('center')} 
            className={`create-toolbar-button ${activeAlignment === 'center' ? 'is-active' : ''}`}
          >
            <AlignCenter />
          </button>
          <button type='button' 
            title='Align-Right'
            onClick={() => handleAlignmentClick('right')} 
            className={`create-toolbar-button ${activeAlignment === 'right' ? 'is-active' : ''}`}
          >
            <AlignRight/>
          </button>
          <button type='button' 
            title='Align-Justify' 
            onClick={() => handleAlignmentClick('justify')} 
            className={`create-toolbar-button ${activeAlignment === 'justify' ? 'is-active' : ''}`}
          >
            <AlignJustify />
          </button>
          <button type='button' title='Add Image-URL'  onClick={insertImageURL} className="create-toolbar-button">
                  <ImageIcon />
                </button>
                <button title='Add YouTube Link' onClick={addYoutubeVideo} className="create-toolbar-button">
  <Clapperboard/>
  </button>
  <button onClick={() => editorTwo.chain().focus().unsetTextAlign().run()} className="create-toolbar-button">
            Unset text align
          </button>
          <button onClick={() => editorTwo.chain().focus().unsetFontFamily().run()} className='create-toolbar-button'
                  data-test-id="unsetFontFamily">
            Unset font family
          </button>
          <button onClick={() => editorTwo.chain().focus().unsetFontSize().run()} className='create-toolbar-button'
                  data-test-id="unsetFontSize">
            Unset font size
          </button>
          <button onClick={() => editorTwo.chain().focus().unsetAllMarks().run()} className='create-toolbar-button'
                  data-test-id="unsetAllMarks">
            Unset All Marks
          </button>
  <button type='button' 
              title='Bullet-List'
              onClick={() => editorTwo.chain().focus().toggleBulletList().run()}
              className={`create-toolbar-button ${editorTwo.isActive('bulletList') ? 'is-active' : ''}`}
            >
              <List />
            </button>
                <button type='button' 
              title='Strike-Through'
              onClick={() => editorTwo.chain().focus().toggleStrike().run()}
              className={`create-toolbar-button ${editorTwo.isActive('strike') ? 'is-active' : ''}`}
            >
              <Strikethrough/>
            </button>
            <button type='button' 
              title='Block-Quote'
              onClick={() => editorTwo.chain().focus().toggleBlockquote().run()}
              className={`create-toolbar-button ${editorTwo.isActive('blockquote') ? 'is-active' : ''}`}
            >
              <MessageSquareQuote/>
            </button>
            <button
          onClick={() => {
            const url = prompt('Enter URL');
            if (url) {
              editorTwo
                .chain()
                .focus()
                .toggleLink({ href: url, target: '_self' }) // Fixed: Removed 'url:' prefix
                .setColor('#bbf7d0 !important') // Blue, distinct from #F5F5F5 (paragraphs)
                .run();
            }
          }}
          className={`create-toolbar-button ${editorTwo.isActive('link') ? 'is-active' : ''}`}
          title="Add URL"
        >
          <Link />
        </button>
            <button
          onClick={() => {
            const url = prompt('Enter phone number (e.g., +1234567890):');
            if (url) {
              editorTwo
                .chain()
                .focus()
                .toggleLink({ href: `tel:${url}`, target: '_self' })
                .setColor('#bbf7d0 !important')
                .run();
            }
          }}
          className={`create-toolbar-button ${editorTwo.isActive('link') ? 'is-active' : ''}`}
          title="Add Phone Link"
        >
          <Link />
        </button>
            <button type='button' 
              title='Set-Paragraph'
              onClick={() => editorTwo.chain().focus().setParagraph().setColor('#F5F5F5').run()}
              className={`create-toolbar-button ${editorTwo.isActive('paragraph') ? 'is-active' : ''}`}
            >
              <Pilcrow/>
            </button>
  
            
          
          
    </div>
    
    
        
        <EditorContent editor={editorTwo} />
    

    </div>

  



  );

}

export default DescriptionEditor;