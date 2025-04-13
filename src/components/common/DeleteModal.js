// DeleteModal.js
import React from 'react';

const DeleteModal = ({
  isVisible,
  onConfirm,
  onCancel,
}) => {
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        zIndex: 1000,
      }}
    >
      <p>本当に削除しますか？</p>
      <button onClick={onConfirm}>はい</button>
      <button onClick={onCancel}>いいえ</button>
    </div>
  );
};

export default DeleteModal;
