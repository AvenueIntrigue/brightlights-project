import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import Underlines from '@tiptap/extension-underline';
import { availableAdobeFonts } from './Fonts';
import { FontSize } from './FontSize';
import Placeholder from '@tiptap/extension-placeholder'; // Import Placeholder extension
import { CaseSensitive, Type, Bold, Italic, Underline } from 'lucide-react';


interface TitleEditorProps {
  onTitleChange: (newTitle: string) => void;
  setEditorOne: (editor: any) => void;
  initialTitle?: string;
}

const TitleEditor: React.FC<TitleEditorProps> = ({ onTitleChange, setEditorOne, initialTitle }) => {

  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableFontSizes = ['12', '14', '16', '18', '20', '24', '30', '36', '48', '64', '72', '96', '144', '288'];
  const availableFontFamilies = ['Arial', 'Georgia', 'Times New Roman', 'Verdana'];
  const [selectedFontSize, setSelectedFontSize] = useState<string>('16');
  
  const editorOne = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Underlines,
      FontFamily,
      FontSize.configure({
        availableFontSizes: availableFontSizes,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          return node.type.name === 'paragraph' ? 'Title' : ''; // Show 'Title' as a placeholder
        },
      
      }),
    ],

    content: initialTitle ? `<h1>${initialTitle}</h1>` : '', // Load initial title if provided, otherwise empty
    onUpdate: ({ editor }) => {
      onTitleChange(editor.getHTML()); // Update the parent when the editor content changes
    },
  });

  // Pass the editor instance back to CreateBlog.tsx
  useEffect(() => {
    if (editorOne) {
      setEditorOne(editorOne);
    }
  }, [editorOne, setEditorOne]);

  // Ref for the font size dropdown
  const fontSizeDropdownRef = useRef<HTMLSelectElement>(null);

  const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = event.target.value;
    setSelectedFontSize(newSize);

    // Apply the selected font size using the editor command
    if (editorOne) {
      editorOne.commands.setFontSize(newSize);
    }
  };

  const openFontSizeDropdown = () => {
    if (fontSizeDropdownRef.current) {
      fontSizeDropdownRef.current.focus(); // Focus the dropdown to auto-open it
      fontSizeDropdownRef.current.click(); // Programmatically trigger a click to open
    }
  };

  const toggleFontDropdown = () => {
    setIsFontDropdownOpen(!isFontDropdownOpen);
  };

  const selectFontFamily = (fontFamily: string) => {
    editorOne?.chain().focus().setFontFamily(fontFamily).run();
    setIsFontDropdownOpen(false); // Close the dropdown after selecting a font
  };

  if (!editorOne) {
    return null;
  }

  const toggleFontSizeDropdown = () => {
    setIsFontSizeDropdownOpen(!isFontSizeDropdownOpen);
    openFontSizeDropdown();
  };

  return (
    <div className='test'>
      <div className='toolbar-top'>
        {/* Font Family Selector */}
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

        {/* Font Size Selector */}
        <button type='button'  onClick={toggleFontSizeDropdown} className={`toolbar-button ${isFontSizeDropdownOpen ? 'active' : ''}`}>
          <CaseSensitive/>
        </button>
        {isFontSizeDropdownOpen && (
          <div className="fontsize-menu">
            <select
              id="font-size-select"
              value={selectedFontSize}
              onChange={handleFontSizeChange}
              ref={fontSizeDropdownRef}
            >
              {availableFontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Other toolbar buttons */}
        <button type='button'
          onClick={() => editorOne.chain().focus().toggleBold().run()}
          className={`toolbar-button ${editorOne.isActive('bold') ? 'is-active' : ''}`}
        >
          <Bold/>
        </button>
        <button type='button'
          onClick={() => editorOne.chain().focus().toggleItalic().run()}
          className={`toolbar-button ${editorOne.isActive('italic') ? 'is-active' : ''}`}
        >
          <Italic/>
        </button>
        <button type='button'
          onClick={() => editorOne.chain().focus().toggleUnderline().run()}
          className={`toolbar-button ${editorOne.isActive('underline') ? 'is-active' : ''}`}
        >
          <Underline/>
        </button>
      </div>

      <div className='editor-one'>
        <EditorContent editor={editorOne} className='mb-4 relative'/>
      </div>
    </div>
  );
};

export default TitleEditor;
