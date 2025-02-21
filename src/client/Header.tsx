
import { useState } from "react";
import BLLogo from "./assets/Bright-Lights-Creative-Logo-Long.svg";
import './Header.css'
import { Link } from "react-router-dom";
const Header = () => {



const [isMenuOpen, setMenuOpen] = useState(false);

const toggleMenu = () => {

    setMenuOpen(!isMenuOpen);


};

    return(
<div className="nav-container mx-auto">
    <div className=" grid grid-cols-2 w-full h-auto items-center">
<div className="bl-logo-container">
        <Link to="/">

<div className="pt-10 pb-10 w-full">
<div className="svg-hover">
        
        
<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400.79 233.55">


  <g>
    <g>
      <path className="cls-1" d="M114.67,230.38l-.13-.06"/>
      <polygon className="cls-1" points="166.81 13.85 210.88 67.56 210.88 67.57 166.81 13.85"/>
      <path className="cls-1" d="M171.38,0c-35.18.56-70.37,1.12-105.55,1.69C43.89,29.62,21.94,57.56,0,85.49l25.09,103.28,89.44,41.55.13.06,6.81,3.17,95.11-47.45,22.21-103.94L171.38,0ZM210.88,67.56l-80.77-35.97,36.71-17.74,44.07,53.7ZM140.79,12.74l-25.42,12.28-25.97-11.57,51.39-.71ZM68.25,17.53l32.59,14.52L30.76,65.9l37.49-48.38ZM115.58,38.61l88.47,39.4-175.07,2.44,86.6-41.84ZM35.66,180.1l-19.14-78.78,82.06,108.01-62.92-29.23ZM120.5,217.81L25.53,92.82l193.91-2.7-98.95,127.69ZM205.78,177.73l-63,31.42,77.7-100.27-14.71,68.85Z"/>
      <line className="cls-1" x1="140.79" y1="12.74" x2="89.4" y2="13.46"/>
      <line className="cls-1" x1="68.25" y1="17.53" x2="30.76" y2="65.9"/>
    </g>
    <g>
      <line className="cls-1" x1="219.45" y1="90.12" x2="25.53" y2="92.82"/>
      <polygon className="cls-1" points="204.06 78.01 204.05 78.01 28.98 80.45 204.06 78.01"/>
    </g>
    <g>
      <line className="cls-1" x1="220.49" y1="108.88" x2="142.79" y2="209.15"/>
      <line className="cls-1" x1="219.45" y1="90.12" x2="120.5" y2="217.81"/>
    </g>
    <g>
      <line className="cls-1" x1="120.5" y1="217.81" x2="25.53" y2="92.82"/>
      <line className="cls-1" x1="98.58" y1="209.32" x2="16.52" y2="101.32"/>
      <polygon className="cls-1" points="114.67 230.38 114.61 230.43 114.53 230.32 114.67 230.38"/>
    </g>
    <g>
      <line className="cls-1" x1="115.58" y1="38.61" x2="28.98" y2="80.45"/>
      <line className="cls-1" x1="100.84" y1="32.05" x2="30.76" y2="65.9"/>
      <line className="cls-1" x1="166.81" y1="13.85" x2="130.1" y2="31.59"/>
      <line className="cls-1" x1="140.79" y1="12.74" x2="115.37" y2="25.03"/>
    </g>
    <g>
      <polygon className="cls-1" points="115.58 38.61 204.05 78.01 204.06 78.01 115.58 38.61"/>
      <polygon className="cls-1" points="210.88 67.56 210.88 67.57 130.1 31.59 210.88 67.56 210.88 67.56"/>
      <line className="cls-1" x1="100.84" y1="32.05" x2="68.25" y2="17.53"/>
      <line className="cls-1" x1="115.37" y1="25.03" x2="89.4" y2="13.46"/>
    </g>
  </g>
  <g>
    <path className="cls-1" d="M342.14,132.1c0,17.76-4.41,23.21-19.27,23.21h-14.16v-26.46h-9.17l4.53-10.56h4.64v-56.06h14.16c14.86,0,19.27,4.18,19.27,19.5v18.69c0,10.33-1.74,16.48-6.85,20.43h6.85v11.26ZM330.88,80.21c0-5.8-1.39-7.08-7.54-7.08h-3.13v45.15h2.67c5.8,0,8.01-5.8,8.01-17.99v-20.08ZM330.88,128.85h-10.68v15.67h3.13c6.15,0,7.54-1.39,7.54-7.08v-8.59Z"/>
    <path className="cls-1" d="M383.68,62.22c14.86,0,19.27,4.18,19.27,19.5v18.69c0,10.33-1.74,16.48-6.85,20.43h6.85v19.04c0,12.3,4.41,15.44,4.41,15.44h-11.26s-4.41-1.51-4.41-15.44v-11.03h-10.68v26.46h-11.49v-26.46h-9.17l4.53-10.56h4.64v-56.06h14.16ZM381.01,73.13v45.15h2.67c5.8,0,8.01-5.8,8.01-17.99v-20.08c0-5.8-1.39-7.08-7.54-7.08h-3.13Z"/>
    <path className="cls-1" d="M439.27,155.31h-11.26V62.22h11.26v93.09Z"/>
    <path className="cls-1" d="M464.8,81.72c0-14.86,2.9-24.72,30.53-19.27v11.03c-16.83-3.71-19.04,0-19.04,7.08v59.31c0,4.87,1.74,6.38,5.22,6.38s5.22-1.28,5.22-6.38v-11.03h-7.54l4.41-10.56h14.62v20.66c0,14.62-8.94,17.87-16.83,17.87-8.71,0-16.6-3.71-16.6-17.87v-57.22Z"/>
    <path className="cls-1" d="M518.54,118.29h4.64v-56.06h11.49v56.06h10.68v-56.06h11.26v93.09h-11.26v-26.46h-10.68v26.46h-11.49v-26.46h-9.17l4.53-10.56Z"/>
    <path className="cls-1" d="M608.48,73.13h-9.52v82.18h-11.26v-82.18h-12.42l4.41-10.91h28.79v10.91Z"/>
    <path className="cls-1" d="M694.83,155.31h-27.74V62.22h11.49v82.76h16.25v10.33Z"/>
    <path className="cls-1" d="M726.51,155.31h-11.26V62.22h11.26v93.09Z"/>
    <path className="cls-1" d="M752.04,81.72c0-14.86,2.9-24.72,30.53-19.27v11.03c-16.83-3.71-19.03,0-19.03,7.08v59.31c0,4.87,1.74,6.38,5.22,6.38s5.22-1.28,5.22-6.38v-11.03h-7.54l4.41-10.56h14.63v20.66c0,14.62-8.94,17.87-16.83,17.87-8.71,0-16.6-3.71-16.6-17.87v-57.22Z"/>
    <path className="cls-1" d="M805.77,118.29h4.64v-56.06h11.49v56.06h10.68v-56.06h11.26v93.09h-11.26v-26.46h-10.68v26.46h-11.49v-26.46h-9.17l4.53-10.56Z"/>
    <path className="cls-1" d="M895.72,73.13h-9.52v82.18h-11.26v-82.18h-12.42l4.41-10.91h28.79v10.91Z"/>
    <path className="cls-1" d="M945.74,135.7c0,14.86-2.79,24.84-30.53,19.27v-11.03c16.83,3.71,19.04,0,19.04-7.08v-8.12h-19.04v-46.89c0-14.86,2.9-24.84,30.53-19.27v11.03c-16.71-3.71-19.04,0-19.04,7.08v37.72h19.04v17.29Z"/>
    <path className="cls-1" d="M1005.96,81.84c0-14.86,2.9-24.72,30.53-19.27v11.14c-16.83-3.83-19.04,0-19.04,7.08v56.18c0,7.08,2.21,10.79,19.04,7.08v11.03c-27.63,5.57-30.53-4.41-30.53-19.27v-53.97Z"/>
    <path className="cls-1" d="M1075.37,62.22c14.86,0,19.27,4.18,19.27,19.5v18.69c0,10.33-1.74,16.48-6.85,20.43h6.85v19.04c0,12.3,4.41,15.44,4.41,15.44h-11.26s-4.41-1.51-4.41-15.44v-11.03h-10.68v26.46h-11.49v-26.46h-9.17l4.53-10.56h4.64v-56.06h14.16ZM1072.7,73.13v45.15h2.67c5.8,0,8.01-5.8,8.01-17.99v-20.08c0-5.8-1.39-7.08-7.55-7.08h-3.13Z"/>
    <path className="cls-1" d="M1132.12,136.97c0,7.08,2.21,10.79,19.03,7.08v11.03c-27.74,5.57-30.53-4.41-30.53-19.27v-6.97h-9.17l4.41-10.56h4.76v-36.56c0-14.86,2.78-24.72,30.53-19.27v11.03c-16.83-3.71-19.03,0-19.03,7.08v37.72h16.83v10.56h-16.83v8.13Z"/>
    <path className="cls-1" d="M1170.3,118.29h4.76v-39.46c0-14.16,8.01-17.88,16.6-17.88,8.12,0,16.71,3.02,16.71,17.88v76.49h-11.14v-26.46h-10.68v26.46h-11.49v-26.46h-9.17l4.41-10.56ZM1197.23,77.78c0-5.11-2.09-6.38-5.34-6.38-3.6,0-5.34,1.51-5.34,6.38v40.51h10.68v-40.51Z"/>
    <path className="cls-1" d="M1259.2,73.13h-9.52v82.18h-11.26v-82.18h-12.42l4.41-10.91h28.79v10.91Z"/>
    <path className="cls-1" d="M1291.7,155.31h-11.26V62.22h11.26v93.09Z"/>
    <path className="cls-1" d="M1349.5,62.22l-13.7,93.09h-11.14l-13-93.09h12.19l6.62,65,7.08-65h11.96Z"/>
    <path className="cls-1" d="M1381.75,136.97c0,7.08,2.21,10.79,19.03,7.08v11.03c-27.74,5.57-30.53-4.41-30.53-19.27v-6.97h-9.17l4.41-10.56h4.76v-36.56c0-14.86,2.78-24.72,30.53-19.27v11.03c-16.83-3.71-19.03,0-19.03,7.08v37.72h16.83v10.56h-16.83v8.13Z"/>
  </g>
</svg>
      
            </div>
            </div>
        </Link>
        </div>
        <div className="flex justify-end">

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
        <a className="hover:text-cyan-400 duration-300" href="/blog"><li className="my-5">BLOG</li></a>
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