// SuccessOverlay.js
import React from 'react';

const SuccessOverlay = ({ message }) => {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
};

export default SuccessOverlay;
