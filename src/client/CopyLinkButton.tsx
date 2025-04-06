import React, { useState } from "react";
import { CopyLinkIcon } from "./CustomIcons";

const CopyLinkButton: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Show checkmark for 2 seconds
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  };

  return (
    <div className="copy-link-container">
      {!isCopied && (
        <button type="button" className="icon-button" onClick={handleCopyLink}>
          <CopyLinkIcon />
        </button>
      )}
      {isCopied && <span className="checkmark">✓</span>}
    </div>
  );
};

export default CopyLinkButton;
