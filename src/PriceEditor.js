import React, { useState } from 'react';

const PriceEditor = ({ selectedRow, onSave }) => {
  const [price, setPrice] = useState(selectedRow.price || '');

  const handleSave = () => {
    onSave(price); // 親コンポーネントの保存処理を呼び出す
  };

  return (
    <div>
      <h3>価格編集</h3>
      <p>識別番号: {selectedRow.id}</p>
      <label>
        価格:
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <button onClick={handleSave}>保存</button>
    </div>
  );
};

export default PriceEditor;
