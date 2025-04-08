import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  FormEvent,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Underlines from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import extLink from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import YouTube from "@tiptap/extension-youtube";
import {
  Bold,
  Heading,
  Italic,
  Underline,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  CaseSensitive,
  ImageIcon,
  Strikethrough,
  Clapperboard,
  MessageSquareQuote,
  Link,
  List,
  Plus,
  Divide,
  Check,
} from "lucide-react";
import { useUser, useSession } from "@clerk/clerk-react";
import axios from "axios";
import "./Create.css";
import Paragraph from "@tiptap/extension-paragraph";
import { availableAdobeFonts } from "./Fonts";
import { FontSize } from "./FontSize";
import { Color } from "@tiptap/extension-color";
import TitleEditor from "./TitleEditor";
import DescriptionEditor from "./DescriptionEditor";

interface Image {
  url: string;
  alt: string;
}

interface CustomDropdownProps {
  pages: string[];
  selectedPage: string;
  onPageSelect: (page: string) => void;
  onPageRemove: (page: string) => void;
}

type CustomElement = { type: "paragraph"; children: CustomText[] };
type CustomText = { text: string };

const initialValue: CustomElement[] = [
  { type: "paragraph", children: [{ text: "" }] },
];

const Create = () => {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useUser();
  const { session } = useSession();

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const knownTypes = [
          "pricing",
          "about",
          "services",
          "web-development",
          "app-development",
          "graphic-design",
          "web3",
          "projects",
        ].map((type) => type.charAt(0).toUpperCase() + type.slice(1));
        let availablePages: string[] = [];

        for (const type of knownTypes) {
          const response = await fetch(`/api/${type.toLowerCase()}posts`);
          if (response.ok) {
            availablePages.push(type);
          } else if (response.status === 404) {
            console.log(`${type} type not found or has no posts.`);
          } else {
            throw new Error(
              `Failed to fetch ${type} page status: ${response.status}`
            );
          }
        }

        setPages(availablePages);
      } catch (error) {
        console.error("Error fetching page types:", error);
      }
    };

    fetchPages();
  }, []);

  const [title, setTitle] = useState("");
  const [editorOne, setEditorOne] = useState<any>(null);
  const [editorTwo, setEditorTwo] = useState<any>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const CustomDropdown: React.FC<CustomDropdownProps> = ({
    pages,
    selectedPage,
    onPageSelect,
    onPageRemove,
  }) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [newPage, setNewPage] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDropdownToggle = () => {
      setIsDropdownVisible(!isDropdownVisible);
    };

    const handlePageSelect = (page: string) => {
      if (page === "Add New Page") {
        setNewPage("");
      } else {
        onPageSelect(page);
        setIsDropdownVisible(false);
      }
    };

    const handleAddNewPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && newPage.trim() && !pages.includes(newPage.trim())) {
        onPageSelect(newPage.trim());
        setNewPage("");
        setIsDropdownVisible(false);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownVisible(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={dropdownRef} className="create-custom-dropdown" onClick={handleDropdownToggle}>
        <div className="cd-input-field absolute top-0 left-0 right-0 outline-3">
          <div className="dropdown-selected block w-full">
            {selectedPage || (
              <div className="create-category-placeholder w-full">
                <span>Page</span>
              </div>
            )}
          </div>
          {isDropdownVisible && (
            <div className="create-dropdown-menu top-0 w-full h-auto rounded-md">
              {pages.map((page) => (
                <div key={page} className="cat-sect w-full h-auto">
                  <div className="dropdown-item w-full h-auto">
                    <span onClick={() => handlePageSelect(page)}>{page}</span>
                  </div>
                </div>
              ))}
              <div className="dropdown-item w-full h-auto bg-transparent">
                <input
                  type="text"
                  className="cat-sect w-full h-auto bg-transparent outline-none hover:text-slate-600 text-center"
                  placeholder="Add New Page"
                  value={newPage}
                  onChange={(e) => setNewPage(e.target.value)}
                  onKeyPress={handleAddNewPage}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addKeywords = () => {
    const newKeywords = inputValue
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== "");
    setKeywords((prev) => [...prev, ...newKeywords]);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addKeywords();
  };

  const handleBlur = () => addKeywords();

  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords((prev) => prev.filter((keyword) => keyword !== keywordToDelete));
  };

  const uploadImage = async (file: File, alt: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      setImages((prev) => [...prev, { url: response.data.secure_url, alt }]);
    } catch (error) {
      console.error("Error uploading image", error);
    }
  };

  const handleCancelImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!user) {
        console.error("User is not defined.");
        return;
      }
      if (!selectedPage) {
        console.warn("No page selected.");
        return;
      }

      // Check if user is admin instead of permissions
      const isAdmin = user.publicMetadata?.isAdmin === true; // Assumes Clerk has an isAdmin flag
      if (!isAdmin) {
        console.error("User is not an admin. Access denied.");
        alert("Only admins can create posts.");
        return;
      }

      const token = await session?.getToken();
      if (!token) {
        console.error("Failed to retrieve token");
        return;
      }

      const endpoint = `/api/${selectedPage.toLowerCase()}posts`; // Relative path for Render
      const newPost = {
        title: editorOne?.getHTML() || "",
        description: editorTwo?.getHTML() || "",
        images: images.length ? images : [{ url: "", alt: "" }],
        pages: selectedPage,
        keywords: keywords.length ? keywords : [],
      };

      console.log("Sending:", newPost);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/${selectedPage.toLowerCase()}`);
      } else {
        const errorDetails = await response.json();
        console.error(`Error creating ${selectedPage.toLowerCase()} post`, errorDetails);
        alert(`Failed to create post: ${errorDetails.message}`);
      }
    } catch (error: any) {
      console.error(`Error creating ${selectedPage.toLowerCase()} post`, error.message);
      alert("An error occurred while creating the post.");
    }
  };

  return (
    <div className="create-grandpa mx-auto">
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="create-form-container">
          <h1 className="create-form-box-text">Create Post</h1>
        </div>
        <div className="create-form-content">
          <TitleEditor
            onTitleChange={(newTitle) => setTitle(newTitle)}
            initialTitle={title}
            setEditorOne={setEditorOne}
          />
          <div title="Choose Desired Page" className="create-input-field relative mb-4">
            <CustomDropdown
              pages={pages}
              selectedPage={selectedPage}
              onPageSelect={setSelectedPage}
              onPageRemove={(page) => setPages((prev) => prev.filter((p) => p !== page))}
            />
          </div>
          <div className="flex w-full h-auto">
            <div title="Upload Image" className="create-input-field relative mb-4 text-wrap p-3 flex-col">
              <input
                type="file"
                className="create-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const alt = prompt("Enter alt text for the image:") || "";
                    uploadImage(e.target.files[0], alt);
                  }
                }}
              />
              {images.map((image, index) => (
                <div key={index} className="create-image-preview-container flex">
                  <img src={image.url} alt={image.alt} className="create-image-preview" />
                  <button onClick={() => handleCancelImage(index)}>x</button>
                  <label>{image.alt}</label>
                </div>
              ))}
            </div>
          </div>
          <DescriptionEditor setEditorTwo={setEditorTwo} />
          <div title="Add Keywords for SEO Optimization" className="create-keywords-section">
            <input
              type="text"
              className="create-input-field relative h-10 mb-4 bg-transparent"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleBlur}
              placeholder="Enter keywords separated by commas"
            />
            <div className="create-keyword-list flex flex-wrap mt-2">
              {keywords.map((keyword, index) => (
                <div key={index} className="create-keyword-chip flex items-center px-2 py-2 mr-2 mb-2 rounded">
                  <button onClick={() => handleDeleteKeyword(keyword)}>x</button>
                  {keyword}
                </div>
              ))}
            </div>
          </div>
          <button
            type="submit"
            title="Submit"
            disabled={!selectedPage}
            className="create-submit-button bg-green-200 border-none text-slate-700 h-10 rounded w-full mt-4 mx-auto"
          >
            <Check className="mx-auto" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Create;