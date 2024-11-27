import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios'; // 郵便番号検索API用
import { AP_OPTIONS, AA_OPTIONS } from './utils'; // 選択肢リストをインポート

const AdditionalInputs = ({
  additionalInputs,
  setAdditionalInputs,
  placeholders,
  akValue,
  alValue,
  handleBatchSubmit,
  isProcessing,
}) => {
  // 郵便番号から住所を取得して状態を更新する関数
  const handlePostalCodeChange = async (postalCode) => {
    // ハイフンの自動挿入
    let formattedPostalCode = postalCode.replace(/[^0-9]/g, ''); // 数字以外を削除
    if (formattedPostalCode.length > 3) {
      formattedPostalCode = `${formattedPostalCode.slice(0, 3)}-${formattedPostalCode.slice(3)}`;
    }

    setAdditionalInputs({ ...additionalInputs, Y: formattedPostalCode }); // 郵便番号を状態に反映

    if (formattedPostalCode.length === 8) { // 郵便番号が「123-4567」の形式になったら
      try {
        const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${formattedPostalCode.replace(/-/g, '')}`);
        if (response.data && response.data.results) {
          const { address1, address2, address3 } = response.data.results[0];
          setAdditionalInputs((prev) => ({
            ...prev,
            X: address1 || '', // 都道府県
            W: address2 || '', // 市区町村
            T: address3 || '', // 町名以下
          }));
        } else {
          alert('住所が見つかりませんでした。郵便番号を確認してください。');
        }
      } catch (error) {
        console.error('郵便番号検索エラー:', error);
        alert('住所検索に失敗しました。後でもう一度試してください。');
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <p><strong>在庫数:</strong> {akValue}</p>
        <p><strong>発送代行ID:</strong> {alValue}</p>
      </div>
      <h3>追加のデータを入力してください</h3>
      {Object.keys(additionalInputs).map((col) => (
        <div key={col} className="additional-input">
          {col === 'D' ? (
<DatePicker
  selected={additionalInputs.D ? new Date(additionalInputs.D) : null}
  onChange={(date) => {
    const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    setAdditionalInputs({ ...additionalInputs, D: formattedDate });
  }}
  dateFormat="yyyy/MM/dd"
  placeholderText={placeholders[col]}
/>


          ) : col === 'AP' ? (
            <select
              name="AP"
              value={additionalInputs.AP}
              onChange={(e) => setAdditionalInputs({ ...additionalInputs, AP: e.target.value })}
            >
              <option value="">{placeholders[col]}</option>
              {AP_OPTIONS.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : col === 'AA' ? (
            <select
              name="AA"
              value={additionalInputs.AA || ""} // 初期値は空白
              onChange={(e) => setAdditionalInputs({ ...additionalInputs, AA: e.target.value })}
            >
              <option value=""></option>
              {AA_OPTIONS.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : col === 'Y' ? (
            // 郵便番号フィールド
            <input
              type="text"
              value={additionalInputs.Y}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder={placeholders[col]}
            />
          ) : (
            // その他のデータ用の通常の入力フォーム
            <input
              type="text"
              value={additionalInputs[col]}
              onChange={(e) =>
                setAdditionalInputs({ ...additionalInputs, [col]: e.target.value })
              }
              placeholder={placeholders[col]}
            />
          )}
        </div>
      ))}
      <button onClick={handleBatchSubmit} disabled={isProcessing}>
        一括反映
      </button>
    </div>
  );
};

export default AdditionalInputs;

