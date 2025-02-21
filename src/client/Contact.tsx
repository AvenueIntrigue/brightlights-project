import React, { useState } from 'react';
import emailjs from "@emailjs/browser";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Divide, Send, ThumbsUp } from 'lucide-react';
import PaperAirplane from '../client/assets/Paper-Airplane-Icon.svg';
import './contact.css';
import TextStyle from '@tiptap/extension-text-style';
import OpenBox from '../client/assets/OpenBox.svg';


const serviceID = "service_kefq6x7";
const templateID = "template_y83enxx";
const userID = "y-Kyq3Fj6epnRRBnp";

const EmailForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        message: "",
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false); // Track submission status
    const [successMessage, setSuccessMessage] = useState(""); // Success feedback
    const [errorMessage, setErrorMessage] = useState(""); // Error feedback
    const [isEditorInvalid, setIsEditorInvalid] = useState(false);
    const [touched, setTouched] = useState({

        name: false,
        phone: false,
        email: false,
    });
    const [editorTouched, setEditorTouched] = useState(false);


    // TipTap Editor initialization
    const editor = useEditor({
        extensions: [StarterKit, TextStyle, Placeholder.configure({

            placeholder: 'Message'

        })],
        content: '',
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            setFormData((prevData) => ({ ...prevData, message: content }));
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name } = e.target;
        setTouched((prevTouched) => ({ ...prevTouched, [name]: true }));
    };

    const isFieldInvalid = (value: string, fieldName: string) => {
        return touched[fieldName as keyof typeof touched] && (!value || value.trim() === '');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        setTouched({ name: true, phone: true, email: true });
        setEditorTouched(true);
        setIsSubmitting(true);
        setSuccessMessage(""); // Clear previous messages
        setErrorMessage("");
    
        if (editor?.getText().trim() === '') {
            setIsEditorInvalid(true);  // Mark editor as invalid
            editor.commands.setContent('<p>Message is required</p>'); // Just insert error message
        } else {
            setIsEditorInvalid(false);  // Editor content is valid
        }
    

        // Check for invalid form fields, including editor content
        if (!formData.name || !formData.phone || !formData.email || editor?.getHTML() === '<p></p>') {
            console.log("One or more fields are empty.");
            setIsSubmitting(false); // Re-enable the button
            return; // Stop form submission if any field is empty
        }
    
        // Debugging line to see form data
        console.log("Form Data:", formData);
    
        try {
            // Prepare template parameters for email
            const templateParams = {
                from_name: formData.name,
                from_email: formData.email,
                message: formData.message,
            };
    
            // Send email using emailjs
            await emailjs.send(serviceID, templateID, templateParams, userID);
    
            // Indicate success and reset form data
            setSuccessMessage("Email Sent Successfully!");
        // Reset form fields and touched states
        setFormData({ name: "", phone: "", email: "", message: "" });
        setTouched({ name: false, phone: false, email: false }); // Reset touched states
        setEditorTouched(false); // Reset editor touched state
        setIsEditorInvalid(false); // Reset editor error state
        editor?.commands.setContent(''); // Reset TipTap content
        } catch (error) {
            console.error("Failed to send email.", error);
            setErrorMessage("Failed to send email. Please try again.");
        } finally {
            setIsSubmitting(false); // Re-enable the button
        }
    };
    




    

    return (
        <div className='contact-container mx-auto'>
            <form className='create-contact' onSubmit={handleSubmit}>
                <div className='form-container flex'>
                    
                    <div className='contact-letter-card'>
                    
                    <div className='contact-letter-container'>
                    <img className='contact-letter-image' src={OpenBox} alt="Open Box Logo" />
                    <h1 className='contact-box-text'>Contact Us</h1>
                    
                    </div>
                    <br/>
                    <div className='contact-friendly-text'>
                    <h4>Hi there! </h4>
                    <br/>
                    <h4>Please fill out the form below & we'll be in touch shortly.</h4>
                    <br/>
                    <h4 className='contact-text-thanks'>~Thanks!</h4>
                    </div>
                    </div>
                    <div className='paper-airplane-card'>
                        <div className='paper-airplane-container'>
                    <img src={PaperAirplane} alt="Paper Airplane Logo" />
                    </div>
                    </div>
                </div>
                <div className='form-content'>
                    <div className='pt-[1%]'>
                    <div className={`input-field ${isFieldInvalid(formData.name, 'name') ? 'input-error' : ''}`}>
                            <label className={`floating-label ${formData.name ? 'filled' : ''}`} htmlFor="name">{isFieldInvalid(formData.name, 'name') ? 'Name required' : 'Name'}</label>
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
                        <div className={`input-field ${isFieldInvalid(formData.phone, 'phone') ? 'input-error' : ''}`}>
                        <label className={`floating-label ${formData.phone ? 'filled' : ''}`} htmlFor="phone">{isFieldInvalid(formData.phone, 'phone') ? 'Phone required' : 'Phone'}</label>
                            <input
                                id="phone"
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                autoComplete="phone"
                            />
                        </div>

                        <div className={`input-field ${isFieldInvalid(formData.email, 'email') ? 'input-error' : ''}`}>
                            <label className={`floating-label ${formData.email ? 'filled' : ''}`} htmlFor="email">{isFieldInvalid(formData.email, 'email') ? 'Email required' : 'Email'}</label>
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

                        <div className={`editor-two ${isEditorInvalid ? 'input-error' : ''}`}>
    <EditorContent editor={editor} className={isEditorInvalid ? 'editor-error' : ''} />
    
</div>


                    </div>
                </div>

                <button
                    type="submit"
                    className={`submit-button bg-green-200 border-none text-slate-700 h-10 rounded w-full mt-4 mx-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting}
                >
            {isSubmitting ? (

                <span className='flex items-center justify-center text-[#6B7280] '>
        <Send className='mr-2'/> Sending...
        </span>
    ) : (
        <span className="flex items-center justify-center">
            <Send className='text-[#353941] mr-2' /> Send
        </span>
    )}
                </button>

                {/* Success and Error Messages */}
                {successMessage && <p className="text-[mediumspringgreen] mt-4"><div className='flex gap-2 items-center'><ThumbsUp/>{successMessage}</div></p>}
                {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
            </form>
        </div>
    );
};

export default EmailForm;
