
import { useState } from "react";
import BLLogo from "./BLLogo";
import './Header.css'
import { Link } from "react-router-dom";
const Header = () => {



const [isMenuOpen, setMenuOpen] = useState(false);

const toggleMenu = () => {

    setMenuOpen(!isMenuOpen);


};

    return(
<div className="nav-container mx-auto">
    <div className="MasterContainer">
      <div className="BLLogoContainer">
    <Link to="/">
      <BLLogo/>
    </Link>
    </div>
        <div className="HamburgerContainer">

            <div className="relative">
                <a onClick={toggleMenu} className="menu-open-btn" href="#">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="hamburger-icon text-[#f5f5f5]">
  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
</svg>
</a>


<nav>
    {isMenuOpen && <div className="offcanvas-menu fixed bg-[#353941] h-screen top-0 right-0 md:w-1/3 shadow-md flex items-center px-8 duration-500 ease-in-out translate-x-0">
    <a onClick={toggleMenu}  className="menu-close-btn absolute top-6 left-6" href="">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-[#f5f5f5] hover:text-cyan-400">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>

    </a>
    <div>
    <ul className="text-xl font-semibold text-[#f5f5f5]" >
        <a className="hover:text-cyan-400 duration-300" href="/"><li className="my-5">HOME</li></a>
        <a className="hover:text-cyan-400 duration-300" href="/about"><li className="my-5">ABOUT</li></a>
        <a className="hover:text-cyan-400 duration-300" href="/portfolio"><li className="my-5">PORTFOLIO</li></a>
        <a className="hover:text-cyan-400 duration-300" href="/services"><li className="my-5">SERVICES</li></a>
        <a className="hover:text-cyan-400 duration-300" href="/pricing"><li className="my-5">PRICING</li></a>
        {/* <a className="hover:text-cyan-400 duration-300" href="/blog"><li className="my-5">BLOG</li></a> */}
        <a className="hover:text-cyan-400 duration-300" href="/contact"><li className="my-5">CONTACT</li></a>
    </ul> 
    </div>
    </div>}
</nav>
            </div>
        </div>

    </div>
    
    
</div>

    );
}

export default Header;