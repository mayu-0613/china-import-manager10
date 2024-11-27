import React from 'react';

const SheetSelector = ({ sheetIds, selectedSheet, setSelectedSheet }) => {
  const handleSelectionChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedSheet(selectedValue !== '' ? selectedValue : null);
  };

  return (
    <div>
      <select value={selectedSheet || ''} onChange={handleSelectionChange}>
        <option value="" disabled>
          スプレッドシートを選択
        </option>
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>

      {/* スプレッドシートが選択されていない場合、メッセージを表示 */}
      {!selectedSheet && <p style={{ color: 'red', marginTop: '10px' }}>スプレッドシートを選択してください。</p>}
    </div>
  );
};

export default SheetSelector;
