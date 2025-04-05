import { useState, useEffect, useRef } from "react";
import BLLogo from "./BLLogo";
import './Header.css';
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  // Type the ref as HTMLDivElement (or null initially)
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if menuRef.current exists and if the click is outside
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="nav-container">
      <div className="MasterContainer">
        <div className="BLLogoContainer">
          <Link to="/">
            <BLLogo />
          </Link>
        </div>
        <div className="HamburgerContainer">
          <div className="relative">
            <a onClick={toggleMenu} className="menu-open-btn" href="#">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="hamburger-icon text-[#f5f5f5]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </a>

            <nav>
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="offcanvas-menu fixed bg-[#353941] h-screen top-0 right-0 md:w-1/3 shadow-md flex items-center px-8 duration-500 ease-in-out translate-x-0"
                >
                  <a
                    onClick={toggleMenu}
                    className="menu-close-btn absolute top-6 left-6"
                    href="#"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 text-[#f5f5f5] hover:text-cyan-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </a>
                  <div>
                    <ul className="text-xl font-semibold text-[#f5f5f5]">
                      <li className="my-5">
                        <Link to="/" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          HOME
                        </Link>
                      </li>
                      <li className="my-5">
                        <Link to="/about" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          ABOUT
                        </Link>
                      </li>
                      <li className="my-5">
                        <Link to="/portfolio" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          PORTFOLIO
                        </Link>
                      </li>
                      <li className="my-5">
                        <Link to="/services" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          SERVICES
                        </Link>
                      </li>
                      <li className="my-5">
                        <Link to="/pricing" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          PRICING
                        </Link>
                      </li>
                      {/* <li className="my-5">
                        <Link to="/blog" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          BLOG
                        </Link>
                      </li> */}
                      <li className="my-5">
                        <Link to="/contact" className="hover:text-cyan-400 duration-300" onClick={toggleMenu}>
                          CONTACT
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;