import React, { useState } from 'react';

const InputField = ({
  inputValue,
  setInputValue,
  handleInput,
  isProcessing,
  handleIdentifierChange,
}) => {
  const [identifierValue, setIdentifierValue] = useState('');
  const [isFetching, setIsFetching] = useState(false); // 検索中の状態を管理

  const onIdentifierChange = async (e) => {
    const value = e.target.value;
    setIdentifierValue(value);

    if (value) {
      setIsFetching(true); // 検索開始
      try {
        const isFound = await handleIdentifierChange(value); // 親コンポーネントの検索処理
        if (!isFound) {
          alert('一致する識別番号が見つかりません。');
        }
      } finally {
        setIsFetching(false); // 検索終了
      }
    } else {
      setInputValue(''); // 識別番号が空なら出品名フィールドをクリア
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px' }}>
      {/* 識別番号入力フィールド */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          value={identifierValue}
          onChange={onIdentifierChange}
          placeholder="識別番号を入力"
        />
      </div>

      {/* 出品名入力フィールド */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="出品名を入力"
        />
        <button onClick={handleInput} disabled={isProcessing}>
          入力
        </button>
      </div>
    </div>
  );
};

export default InputField;