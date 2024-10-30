import React from "react";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import './Footer.css'; // Assuming you have a CSS file for the footer styles

function Footer() {
    const today = new Date();
    const year = today.getFullYear();

    return (
        <div className="footer">
            <div className="contact">
                <div className="contact-heading">
                <h1>Contact Us</h1>
                </div>
                <div className="contact-subheadings">
                <h3>info@brightlightscreative.com</h3>
                <h3>808.989.1962</h3>
                </div>
            </div>
            <div className="footer-icons">
                
                
                    <SignedOut>
                        <SignInButton mode="redirect">

                            <button className="btn">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <a href="" className="px-5">
                        <UserButton/>
                        </a>

                    </SignedIn>
                
                <a href=""><i className="fa-brands fa-xl fa-x-twitter px-5"></i></a>
                <a href=""><i className="fa-brands fa-xl fa-github px-5"></i></a>
                <a href=""><i className="fa-brands fa-xl fa-youtube px-5"></i></a>
                <a href=""><i className="fa-brands fa-xl fa-facebook px-5"></i></a>
                <br />
                <br />
                
            </div>
            <div className="copyright">
                    <p>Copyright © {year} &nbsp; Bright Lights Creative</p>
                </div>
        </div>
    );
}

export default Footer;
