import React, {
  useMemo,
  useEffect,
  useState,
  useCallback,
  FormEvent,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { EditorContent, isActive, useEditor } from "@tiptap/react";
import { Node, mergeAttributes } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import FontFamily from "@tiptap/extension-font-family";
import Underlines from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import extLink from "@tiptap/extension-link";
import ListItem from "@tiptap/extension-list-item";
import YouTube, { Youtube } from "@tiptap/extension-youtube";
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
import "../client/CreateAbout.css";
import Paragraph from "@tiptap/extension-paragraph";
import { availableAdobeFonts } from "./Fonts";
import { FontSize } from "./FontSize";
import TitleEditor from "./TitleEditor";
import DescriptionEditor from "./DescriptionEditor";

interface PublicMetadata {
  permissions?: string[];
}

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
  const [pages, setPages] = useState<string[]>(["About", "Services"]);

  const [selectedPage, setSelectedPage] = useState<string>("");

  const availableFontSizes = [
    "12",
    "14",
    "16",
    "18",
    "20",
    "24",
    "30",
    "36",
    "48",
    "64",
    "72",
    "96",
    "144",
    "288",
  ];

  const [selectedFontSize, setSelectedFontSize] = useState<string>("16");

  // Ref for the font size dropdown
  const fontSizeDropdownRef = useRef<HTMLSelectElement>(null);

  const navigate = useNavigate();

  const { user } = useUser();
  const { session } = useSession();
  const [title, setTitle] = useState("");
  const [editorOne, setEditorOne] = useState<any>(null);
  const [editorTwo, setEditorTwo] = useState<any>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [page, setPage] = useState("");
  const [newPage, setNewPage] = useState("");
  const [showNewPageInput, setShowNewPageInput] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState("");
  const [fileName, setFileName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [isCancelTriggered, setIsCancelTriggered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState("");
  const [isFocused, setIsFocused] = useState(false); // State to track focus
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isFontSizeDropdownOpen, setIsFontSizeDropdownOpen] = useState(false);
  const [activeAlignment, setActiveAlignment] = useState<
    "left" | "center" | "right" | "justify" | ""
  >("");
  const [height, setHeight] = React.useState(480);
  const [width, setWidth] = React.useState(640);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
  };

  const toggleFontDropdown = () => {
    setIsFontDropdownOpen(!isFontDropdownOpen);
  };

  const handleAddPage = () => {
    if (newPage.trim()) {
      setPages((prev) => [...prev, newPage]);
      setPage(newPage);
      setShowNewPageInput(false);
      setNewPage("");
    }
  };

  const handleRemovePage = (pageToRemove: string) => {
    setPages((prev) => prev.filter((pag) => pag !== pageToRemove));
    if (page === pageToRemove) {
      setPage("");
    }
  };

  const handlePageSelect = (selectedPage: string) => {
    setSelectedPage(selectedPage);
    setPage(selectedPage); // Update this if you're using it elsewhere
    if (selectedPage === "Add New Page") {
      setShowNewPageInput(true);
    } else {
      setShowNewPageInput(false);
    }
  };

  const handlePageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPage(value);

    // Show the input field only if the "Add New Category" option is selected
    if (value === "Add New Page") {
      setShowNewPageInput(true);
    } else {
      setShowNewPageInput(false);
    }
  };

  const handleNewPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPage(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const CustomDropdown: React.FC<CustomDropdownProps> = ({
    pages,
    selectedPage,
    onPageSelect,
    onPageRemove,
  }) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [showNewPageInput, setShowNewPageInput] = useState(false); // State to toggle new category input field
    const [newPage, setNewPage] = useState(""); // State to hold new category input
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDropdownToggle = () => {
      setIsDropdownVisible(!isDropdownVisible);
    };

    const handlePageClick = (page: string) => {
      if (page === "Add New Page") {
        setShowNewPageInput(true); // Show the input field
      } else {
        onPageSelect(page);
        setIsDropdownVisible(false); // Close dropdown when category is selected
      }
    };

    const handleAddNewPage = () => {
      if (newPage.trim()) {
        onPageSelect(newPage); // Add and select the new category
        setShowNewPageInput(false); // Hide input field after adding
        setNewPage(""); // Clear the input field
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
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    return (
      <div
        className="custom-dropdown h-10"
        ref={dropdownRef}
        onClick={handleDropdownToggle}
      >
        <div className="dropdown-selected block w-full">
          {showNewPageInput ? (
            <div className="input-button-div flex flex-row">
              <div className="add-new-input-container">
                <input
                  type="text"
                  className="add-new-input"
                  value={newPage}
                  onChange={(e) => setNewPage(e.target.value)}
                  placeholder="Add New Page"
                  ref={inputRef}
                />
              </div>
              <div className="add-new-button-container">
                <a
                  type="button"
                  onClick={handleAddNewPage}
                  className="add-new-button"
                >
                  <Plus />
                </a>
              </div>
            </div>
          ) : selectedPage ? (
            selectedPage
          ) : (
            <span className="category-placeholder">Page</span>
          )}
        </div>
        {isDropdownVisible && (
          <div className="custom-menu dropdown-menu left-0 w-[33%] rounded-xl">
            {!showNewPageInput ? (
              <>
                {pages.map((pag) => (
                  <div key={pag} className="cat-sect">
                    <div className="dropdown-item">
                      <button
                        className="remove-category w-[10%] mr-3"
                        onClick={() => onPageRemove(pag)}
                      >
                        x
                      </button>
                      <span onClick={() => handlePageClick(pag)}>{pag}</span>
                    </div>
                  </div>
                ))}
                <button
                  className="addnew mx-auto"
                  onClick={() => handlePageClick("Add New Page")}
                >
                  Add New Page
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  // Handle pressing Enter to submit keywords
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
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
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== "");

    setKeywords((prevKeywords) => [...prevKeywords, ...newKeywords]); // Add new keywords to the array
    setInputValue(""); // Clear input field after adding
  };

  // Remove a keyword
  const handleDeleteKeyword = (keywordToDelete: string) => {
    setKeywords((prevKeywords) =>
      prevKeywords.filter((keyword) => keyword !== keywordToDelete)
    );
  };

  // Clear all keywords
  const handleClearAllKeywords = () => {
    setKeywords([]); // Clear all keywords
  };

  const uploadImage = async (file: File, alt: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    );

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        formData
      );

      setImages((prevImages) => [
        ...prevImages,
        { url: response.data.secure_url, alt },
      ]);
    } catch (error) {
      console.error("Error uploading image", error);
    }
  };

  const handleAltChange = (index: number, newAlt: string) => {
    const newImages = [...images];
    newImages[index].alt = newAlt;
    setImages(newImages);
  };

  const handleCancelImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
    setImagePreview("");
    setIsImageUploaded(false);
    setFileName("Image URL");
    setIsCancelTriggered(true);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    ); // Replace with your Cloudinary upload preset

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        formData
      );
      return response.data.secure_url; // Return the URL of the uploaded image
    } catch (error) {
      console.error("Error uploading image to Cloudinary", error);
      throw new Error("Image upload failed");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!user) {
        console.error("User is not defined.");
        return;
      }
      if (!selectedPage) {
        console.warn("No page selected, using default endpoint");
      }
      const endpoint = `http://localhost:3000/api/${
        selectedPage.toLowerCase() || "default"
      }posts`;
      const publicMetadata = user.publicMetadata as PublicMetadata;
      const hasPermission = publicMetadata.permissions?.includes(
        `create:${selectedPage.toLowerCase()}_post`
      );

      if (!hasPermission) {
        console.error(
          `User does not have permission to create ${selectedPage.toLowerCase()} posts.`
        );
        return;
      }

      const token = await session?.getToken();

      if (!token) {
        console.error("Failed to retrieve token");
        return;
      }

      const newPost = {
        title: editorOne?.getHTML() || "",
        description: editorTwo?.getHTML() || "",
        images: images.length ? images : [{ url: "", alt: "" }], // At least one image object
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
      }
      if (!response.ok) {
        const errorDetails = await response.json();
        console.error(
          `Error creating ${selectedPage.toLowerCase()} post`,
          errorDetails
        );
        // Here you can handle specific validation errors if needed
      }
    } catch (error: any) {
      console.error(
        `Error creating ${selectedPage.toLocaleLowerCase()} post`,
        error.message
      );
    }
  };

  return (
    <div className="create-blog-container mx-auto">
      <form className="create-blog" onSubmit={handleSubmit}>
        <div className="form-container">
          <h1 className="form-box-text">Create Post</h1>
        </div>
        <div className="form-content">
          <div className="pt-[1%]">
            <TitleEditor
              onTitleChange={(newTitle) => setTitle(newTitle)}
              initialTitle={title}
              setEditorOne={setEditorOne}
            />

            <div className="input-field relative">
              <CustomDropdown
                pages={pages}
                selectedPage={selectedPage}
                onPageSelect={handlePageSelect}
                onPageRemove={handleRemovePage}
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
              {!fileName && focusedField !== "imageURL" && (
                <label className="block pt-1 pl-5">
                  Image URL: (1/1 Aspect Ratio)
                </label>
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
                      const alt = prompt("Enter alt text for the image:");
                      if (alt) {
                        uploadImage(e.target.files[0], alt);
                      }
                    }
                  }}
                  required
                  onFocus={() => setFocusedField("imageURL")}
                  onBlur={() => setFocusedField("")}
                />
                <div className="custom-file-label">Choose file</div>
              </div>
            </div>

            <div className="input-field">
              {images.map((image, index) => (
                <div key={index} className="image-preview-container">
                  <div className="image-cancel">
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

            <DescriptionEditor setEditorTwo={setEditorTwo} />

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
                  <div
                    key={index}
                    className="keyword-chip flex items-center px-2 py-2 mr-2 mb-2 rounded"
                  >
                    <button
                      onClick={() => handleDeleteKeyword(keyword)}
                      className="keyword-btn"
                    >
                      x
                    </button>
                    {keyword}
                  </div>
                ))}
              </div>

              {/* Clear All Button */}
              {keywords.length > 0 && (
                <button
                  onClick={handleClearAllKeywords}
                  className="clear-all-btn text-red-500 mt-2"
                >
                  Clear All Keywords
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedPage}
          className="submit-button bg-green-200 border-none text-slate-700 h-10 rounded w-full mt-4 mx-auto"
        >
          <Check className="mx-auto" />
        </button>
      </form>
    </div>
  );
};

export default Create;
