import React, { useEffect, useState } from "react";
import axios from "axios";

const BLLogo: React.FC = () => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const cloudinaryXUrl = "https://res.cloudinary.com/dqltncrkn/image/upload/v1743451017/Bright-Lights-Creative-Logo-Long_deacks.svg";

  useEffect(() => {
    const fetchSvg = async () => {
      try {
        const response = await axios.get(cloudinaryXUrl, {
          responseType: "text", // Ensure we get the raw SVG as text
        });
        setSvgContent(response.data);
      } catch (error) {
        console.error("Error fetching SVG from Cloudinary:", error);
      }
    };

    fetchSvg();
  }, []);

  // Render the SVG content using dangerouslySetInnerHTML
  return (
    <div className="BLLogo-container">
      {svgContent ? (
        <div dangerouslySetInnerHTML={{ __html: svgContent }} />
      ) : (
        <p>Loading SVG...</p>
      )}
    </div>
  );
};

export default BLLogo;