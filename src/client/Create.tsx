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
import { Node as TipTapNode, mergeAttributes } from "@tiptap/core";
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
import "./Create.css";
import Paragraph from "@tiptap/extension-paragraph";
import { availableAdobeFonts } from "./Fonts";
import { FontSize } from "./FontSize";
import { Color } from "@tiptap/extension-color";
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
  const [pages, setPages] = useState<string[]>([]);

  const [selectedPage, setSelectedPage] = useState<string>("");

  useEffect(() => {
    const fetchPages = async () => {
      try {
        // Hardcoded list of known page types, capitalized here
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
          const response = await fetch(
            `http://localhost:3000/api/${type.toLowerCase()}`
          );
          if (response.ok) {
            // If the response is OK, we know this type exists, so we add it to our list
            availablePages.push(type);
          } else if (response.status === 404) {
            // If 404, it means this type doesn't exist or has no posts yet
            console.log(`${type} type not found or has no posts.`);
          } else {
            throw new Error(
              `Failed to fetch ${type} page status: ${response.status}`
            );
          }
        }

        setPages(availablePages); // Update the state with the types that exist
      } catch (error) {
        console.error("Error fetching page types:", error);
      }
    };

    fetchPages();
  }, []);

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

    const handleDropdownToggle = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== inputRef.current) {
        setIsDropdownVisible(!isDropdownVisible);
      }
    };

    const handlePageSelect = (page: string) => {
      onPageSelect(page);
      setIsDropdownVisible(false);
    };

    const handlePageClick = (page: string) => {
      if (page === "Add New Page") {
        setShowNewPageInput(true); // Show the input field
      } else {
        onPageSelect(page);
        setTimeout(() => setIsDropdownVisible(false), 0); // Close dropdown after state update
      }
    };

    const handleAddNewPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (newPage.trim() && !pages.includes(newPage.trim())) {
          // Add new page to the list and select it
          onPageSelect(newPage.trim());
          onPageRemove("Add New Page"); // Assuming "Add New Page" is an option
          setNewPage(""); // Clear the input
        }
        setIsDropdownVisible(false); // Close dropdown after adding new page
      }
    };

    const handleRemovePage = (pageToRemove: string) => {
      setPages((prevPages) =>
        prevPages.filter((page) => page !== pageToRemove)
      );
      if (selectedPage === pageToRemove) {
        setSelectedPage(""); // Reset selection if the removed page was selected
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as EventTarget;
      if (dropdownRef.current && target instanceof Node) {
        if (
          !dropdownRef.current.contains(target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(target as Node)
        ) {
          setIsDropdownVisible(false);
        }
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
        ref={dropdownRef}
        className="create-custom-dropdown"
        onClick={handleDropdownToggle}
      >
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
                    <span
                      className="w-full h-auto "
                      onClick={() => handlePageSelect(page)}
                    >
                      {page}
                    </span>
                  </div>
                </div>
              ))}
              <div className="dropdown-item w-full h-auto bg-transparent">
                <input
                  type="text"
                  ref={inputRef}
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

        editorTwo.chain().focus().unsetColor().run();
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
    <div className="create-grandpa mx-auto">
      <form className="create-form" onSubmit={handleSubmit}>
        <div className="create-form-container">
          <h1 className="create-form-box-text">Create Post</h1>
        </div>
        <div className="create-form-content">
          <div title="Add Title" className="">
            <TitleEditor
              onTitleChange={(newTitle) => setTitle(newTitle)}
              initialTitle={title}
              setEditorOne={setEditorOne}
            />

            <div
              title="Choose Desired Page"
              className="create-input-field relative mb-4 "
            >
              <CustomDropdown
                pages={pages}
                selectedPage={selectedPage}
                onPageSelect={handlePageSelect}
                onPageRemove={handleRemovePage}
              />
            </div>

            <div className="flex w-full h-auto">
              <div
                title="Upload Image"
                className="create-input-field relative mb-4 text-wrap p-3 flex-col"
              >
                <div className="">
                  <div className="">
                    {isImageUploaded && (
                      <div className="create-image-preview-container p-[7%] w-full h-auto">
                        <div className="flex-row">
                          <img
                            src={imagePreview}
                            alt="Image Preview"
                            className="w-[50px] h-[50px] object-cover rounded-full mr-2 flex"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex">
                      {!fileName && focusedField !== "imageURL" && (
                        <div className="img-label-container">
                          <label className="img-label">
                            Image URL: (1/1 Aspect Ratio PDF JPG PNG)
                          </label>
                        </div>
                      )}
                      {fileName && (
                        <label className="create-file-name col-y pt-1 pl-5">
                          {fileName}
                        </label>
                      )}

                      <div className="create-file-input-wrapper">
                        <input
                          type="file"
                          className="create-file-input"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const alt = prompt(
                                "Enter alt text for the image:"
                              );
                              if (alt) {
                                uploadImage(e.target.files[0], alt);
                              }
                            }
                          }}
                          required
                          onFocus={() => setFocusedField("imageURL")}
                          onBlur={() => setFocusedField("")}
                        />
                        <div className="create-custom-file-label">
                          <label className="w-full h-auto flex-1">
                            Choose file
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Preview Section */}

                <div className="create-ips-container">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="create-image-preview-container flex"
                    >
                      <div className="create-image-container">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="create-image-preview"
                        />
                      </div>
                      <div className="create-image-cancel">
                        <div className="create-cancel-button-container flex-1">
                          <button
                            className="create-cancel-button"
                            onClick={() => handleCancelImage(index)}
                          >
                            x
                          </button>
                        </div>
                      </div>
                      <div className="create-img-alt-text-container text-wrap">
                        <label className="create-image-alt-text">
                          {image.alt}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* <Image Preview Section/> */}

            <div className="editorContainer" title="Add Your Article">
              <DescriptionEditor setEditorTwo={setEditorTwo} />
            </div>

            <div
              title="Add Keywords for SEO Optimization"
              className="create-keywords-section"
            >
              <div className="">
                <input
                  type="text"
                  className="create-input-field relative h-10 mb-4 bg-transparent"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress} // Handle pressing Enter
                  onBlur={handleBlur} // Handle when the input loses focus
                  placeholder="Enter keywords separated by commas"
                />
              </div>

              {/* Display added keywords */}
              <div className="create-keyword-list flex flex-wrap mt-2">
                {keywords.map((keyword, index) => (
                  <div
                    key={index}
                    className="create-keyword-chip flex items-center px-2 py-2 mr-2 mb-2 rounded"
                  >
                    <button
                      title="Delete Keyword"
                      onClick={() => handleDeleteKeyword(keyword)}
                      className="create-keyword-btn"
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
                  className="create-clear-all-btn text-red-500 mt-2"
                >
                  Clear All Keywords
                </button>
              )}
            </div>
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
      </form>
    </div>
  );
};

export default Create;
