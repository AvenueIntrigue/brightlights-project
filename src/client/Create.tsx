import React, {
  useEffect,
  useState,
  FormEvent,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useUser, useAuth } from "@clerk/clerk-react";
import axios from "axios";
import "./Create.css";
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

const Create = () => {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const navigate = useNavigate();

  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();

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

        const availablePages: string[] = [];

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

  const CustomDropdown: React.FC<CustomDropdownProps> = ({
    pages,
    selectedPage,
    onPageSelect,
  }) => {
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [newPage, setNewPage] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDropdownToggle = () => setIsDropdownVisible(!isDropdownVisible);

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
                  onKeyDown={handleAddNewPage}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const addKeywords = () => {
    const newKeywords = inputValue
      .split(",")
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== "");
    setKeywords((prev) => [...prev, ...newKeywords]);
    setInputValue("");
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
      if (!isLoaded) {
        alert("Auth is still loading—try again in a moment.");
        return;
      }
      if (!isSignedIn) {
        alert("You must be signed in.");
        return;
      }
      if (!user) {
        alert("User not found.");
        return;
      }
      if (!selectedPage) {
        alert("Please select a page.");
        return;
      }

      // Admin check (matches your backend logic)
      const role = (user.publicMetadata as any)?.role;
      const isAdmin = role === "Admin";
      if (!isAdmin) {
        alert("Only admins can create posts.");
        return;
      }

      // ✅ Fresh token immediately before request
      const token = await getToken({ skipCache: true });
      if (!token) {
        alert("Could not get an auth token. Please sign out/in and try again.");
        return;
      }

      const endpoint = `/api/${selectedPage.toLowerCase()}posts`;
      const newPost = {
        title: editorOne?.getHTML() || "",
        description: editorTwo?.getHTML() || "",
        images: images.length ? images : [{ url: "", alt: "" }],
        pages: selectedPage,
        keywords: keywords.length ? keywords : [],
      };

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        await response.json();
        navigate(`/${selectedPage.toLowerCase()}`);
      } else {
        const errorDetails = await response.json().catch(() => ({}));
        console.error(`Error creating ${selectedPage.toLowerCase()} post`, errorDetails);
        alert(`Failed to create post: ${errorDetails.message || response.status}`);
      }
    } catch (error: any) {
      console.error(`Error creating ${selectedPage.toLowerCase()} post`, error?.message || error);
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
              onPageRemove={() => {}}
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
                  <button type="button" onClick={() => handleCancelImage(index)}>x</button>
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
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addKeywords();
                }
              }}
              onBlur={addKeywords}
              placeholder="Enter keywords separated by commas"
            />

            <div className="create-keyword-list flex flex-wrap mt-2">
              {keywords.map((keyword, index) => (
                <div key={index} className="create-keyword-chip flex items-center px-2 py-2 mr-2 mb-2 rounded">
                  <button type="button" onClick={() => setKeywords((prev) => prev.filter((k) => k !== keyword))}>
                    x
                  </button>
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