import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Send, ThumbsUp } from "lucide-react";
import PaperAirplane from "../client/assets/Paper-Airplane-Icon.svg";
import "./contact.css";
import TextStyle from "@tiptap/extension-text-style";
import OpenBoxIcon from "./OpenBoxIcon";

const serviceID = "service_kefq6x7";
const templateID = "template_y83enxx";
const userID = "y-Kyq3Fj6epnRRBnp";

interface Post {
  email: string;
  phone: string;
  acceptsEmail: boolean;
  acceptsMarketing: boolean;
}

const EmailForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
    acceptsEmailMarketing: false, // New field for email consent
    acceptsTextMarketing: false, // New field for text consent
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isEditorInvalid, setIsEditorInvalid] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    phone: false,
    email: false,
  });
  const [editorTouched, setEditorTouched] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Placeholder.configure({ placeholder: "Message" }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setFormData((prevData) => ({ ...prevData, message: content }));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
  };

  const isFieldInvalid = (value: string, fieldName: string) => {
    return (
      touched[fieldName as keyof typeof touched] &&
      (!value || value.trim() === "")
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({ name: true, phone: true, email: true });
    setEditorTouched(true);
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (editor?.getText().trim() === "") {
      setIsEditorInvalid(true);
      editor.commands.setContent("<p>Message is required</p>");
      setIsSubmitting(false);
      return;
    } else {
      setIsEditorInvalid(false);
    }

    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      editor?.getHTML() === "<p></p>"
    ) {
      console.log("One or more fields are empty.");
      setIsSubmitting(false);
      return;
    }

    console.log("Form Data:", formData);

    try {
      // Send email via EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        acceptsEmailMarketing: formData.acceptsEmailMarketing,
        acceptsTextMarketing: formData.acceptsTextMarketing,
      };
      await emailjs.send(serviceID, templateID, templateParams, userID);

      // If either marketing option is checked, send to backend
      if (formData.acceptsEmailMarketing || formData.acceptsTextMarketing) {
        const response = await fetch("http://localhost:3000/api/marketing", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            acceptsEmailMarketing: formData.acceptsEmailMarketing,
            acceptsTextMarketing: formData.acceptsTextMarketing,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save marketing consent");
        }
      }

      setSuccessMessage("Email Sent Successfully!");
      setFormData({
        name: "",
        phone: "",
        email: "",
        message: "",
        acceptsEmailMarketing: false,
        acceptsTextMarketing: false,
      });
      setTouched({ name: false, phone: false, email: false });
      setEditorTouched(false);
      setIsEditorInvalid(false);
      editor?.commands.setContent("");
    } catch (error) {
      console.error("Error during submission:", error);
      setErrorMessage(
        "Failed to send email or save consent. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container mx-auto">
      <form className="create-contact" onSubmit={handleSubmit}>
        <div className="form-container">
          <div className="letter-card">
            <div className="logo-card">
              <div className="bl-logo-card-img-container">
                <div className="bl-logo-img">
                  <OpenBoxIcon />
                </div>
                <div className="bl-logo-title-container">
                  <div className="bl-logo-title">
                    <h1>Contact Us</h1>
                  </div>
                </div>
              </div>
            </div>
            <div className="letter-card-container">
              <h4>Hi there!</h4>
              <br />
              <h4>
                Please fill out the form below & we'll be in touch shortly.
              </h4>
              <br />
              <h4 className="contact-text-thanks">~Thanks!</h4>
            </div>
          </div>
          <div className="paper-airplane-card">
            <div className="paper-airplane-container">
              <img src={PaperAirplane} alt="Paper Airplane Logo" />
            </div>
          </div>
        </div>
        <div className="form-content">
          <div className="">
            <div
              className={`input-field ${
                isFieldInvalid(formData.name, "name") ? "input-error" : ""
              }`}
            >
              <label
                className={`floating-label ${formData.name ? "filled" : ""}`}
                htmlFor="name"
              >
                {isFieldInvalid(formData.name, "name")
                  ? "Name required"
                  : "Name"}
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="name"
              />
            </div>
            <div
              className={`input-field ${
                isFieldInvalid(formData.phone, "phone") ? "input-error" : ""
              }`}
            >
              <label
                className={`floating-label ${formData.phone ? "filled" : ""}`}
                htmlFor="phone"
              >
                {isFieldInvalid(formData.phone, "phone")
                  ? "Phone required"
                  : "Phone"}
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="tel"
              />
            </div>
            <div
              className={`input-field ${
                isFieldInvalid(formData.email, "email") ? "input-error" : ""
              }`}
            >
              <label
                className={`floating-label ${formData.email ? "filled" : ""}`}
                htmlFor="email"
              >
                {isFieldInvalid(formData.email, "email")
                  ? "Email required"
                  : "Email"}
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
              />
            </div>
            <div className="">
              <div className={`editor${isEditorInvalid ? "input-error" : ""}`}>
                <EditorContent
                  editor={editor}
                  className={isEditorInvalid ? "editor-error" : ""}
                />
              </div>
            </div>
            {/* Checkboxes for Marketing Consent */}
            <div className="consent-container">
              <label className="consent-label">
                <input
                  type="checkbox"
                  className="checkbox-marketing"
                  name="acceptsEmailMarketing"
                  checked={formData.acceptsEmailMarketing}
                  onChange={handleChange}
                />
                <span>
                  I agree to receive marketing emails from Bright Lights
                  Creative. I understand I can unsubscribe at any time using the
                  link provided in the emails.
                </span>
              </label>
              <label className="consent-label">
                <input
                  type="checkbox"
                  className="checkbox-marketing"
                  name="acceptsTextMarketing"
                  checked={formData.acceptsTextMarketing}
                  onChange={handleChange}
                />
                <span>
                  I consent to receive marketing text messages from Bright
                  Lights Creative at the phone number provided. Message and data
                  rates may apply. Message frequency varies. Reply STOP to
                  opt-out or HELP for assistance.
                </span>
              </label>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className={`submit-button bg-green-200 border-none text-slate-700 h-10 rounded w-full mt-4 mx-auto ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center text-[#6B7280]">
              <Send className="mr-2" /> Sending...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <Send className="text-[#353941] mr-2" /> Send
            </span>
          )}
        </button>
        {successMessage && (
          <p className="text-[mediumspringgreen] mt-4">
            <div className="flex gap-2 items-center">
              <ThumbsUp /> {successMessage}
            </div>
          </p>
        )}
        {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
      </form>
      <div className="Contact-Address-Master">
        <div className="Contact-Address-Container">
          <div>
            <h4>Bright Lights Creative</h4>
          </div>
          <div>
            <h4>75-5660 Kopiko ST. STE. C-7 PMB #108</h4>
          </div>
          <div>
            <h4>Kailua-Kona, HI 96740-3122</h4>
          </div>
          <div>
            <h4>808.989.1962</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailForm;
