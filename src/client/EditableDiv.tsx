import React, { useState, useRef } from 'react';

const EditableDiv = () => {
  const [hasContent, setHasContent] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLDivElement>) => {
    setHasContent(e.target.innerText.trim().length > 0);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', }}>
      {!hasContent && (
        <span
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            color: '#999',
            pointerEvents: 'none',
            padding: '8px'
          }}
        >
          Add New Category
        </span>
      )}
      <div
        contentEditable
        ref={editableRef}
        onInput={handleInput}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid #ccc',
          padding: '8px',
          boxSizing: 'border-box'
        }}
        suppressContentEditableWarning
      >
      </div>
    </div>
  );
};

export default EditableDiv;
