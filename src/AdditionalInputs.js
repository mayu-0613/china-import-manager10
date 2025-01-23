import React, { useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { AQ_OPTIONS, AA_OPTIONS } from './utils';


const AdditionalInputs = ({
  additionalInputs,
  setAdditionalInputs,
  placeholders,
  akValue,
  alValue,
  handleBatchSubmit,
  isProcessing,
  disableFields,
  setDisableFields, // 親から渡された関数
}) => {
  // 郵便番号から住所を取得して状態を更新する関数
  const handlePostalCodeChange = async (postalCode) => {
    let formattedPostalCode = postalCode.replace(/[^0-9]/g, '');
    if (formattedPostalCode.length > 3) {
      formattedPostalCode = `${formattedPostalCode.slice(0, 3)}-${formattedPostalCode.slice(3)}`;
    }

    setAdditionalInputs({ ...additionalInputs, Y: formattedPostalCode });

    if (formattedPostalCode.length === 8) {
      try {
        const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${formattedPostalCode.replace(/-/g, '')}`);
        if (response.data && response.data.results) {
          const { address1, address2, address3 } = response.data.results[0];
          setAdditionalInputs((prev) => ({
            ...prev,
            X: address1 || '',
            W: address2 || '',
            T: address3 || '',
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

  // S列の値を監視してグレーアウト対象を動的に更新
  useEffect(() => {
    if (additionalInputs.S === 'らくらくメルカリ便' || additionalInputs.S === 'ゆうパケットポスト') {
      setDisableFields(['T', 'U', 'W', 'X', 'Y']); // グレーアウト
    } else {
      setDisableFields([]); // 有効化
    }
  }, [additionalInputs.S, setDisableFields]); // S列の値に依存

  return (
    <div>
      <div style={{ marginBottom: '10px' }}>
        <p><strong>在庫数:</strong> {akValue}</p>
        <p><strong>発送代行ID:</strong> {alValue}</p>
      </div>
      <h3>追加のデータを入力してください</h3>
      {Object.keys(additionalInputs).map((col) => (
        <div key={col} className="additional-input" style={{ marginBottom: '10px' }}>
          {col === 'S' && (
            <>
              <div style={{ marginBottom: '10px' }}>
                <button
                  onClick={() =>
                    setAdditionalInputs((prev) => ({ ...prev, S: 'らくらくメルカリ便' }))
                  }
                >
                  らくらくメルカリ便
                </button>
                <button
                  onClick={() =>
                    setAdditionalInputs((prev) => ({ ...prev, S: 'ゆうパケットポスト' }))
                  }
                >
                  ゆうパケットポスト
                </button>
              </div>
            </>
          )}
          {col === 'D' ? (
            <DatePicker
              selected={additionalInputs.D ? new Date(additionalInputs.D) : null}
              onChange={(date) => {
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                setAdditionalInputs({ ...additionalInputs, D: formattedDate });
              }}
              dateFormat="yyyy/MM/dd"
              placeholderText={placeholders[col]}
              disabled={disableFields.includes(col)}
              style={{
                backgroundColor: disableFields.includes(col) ? '#d3d3d3' : 'white',
              }}
            />
          ) : col === 'AQ' ? (
            <select
              name="AQ"
              value={additionalInputs.AQ}
              onChange={(e) => setAdditionalInputs({ ...additionalInputs, AQ: e.target.value })}
              disabled={disableFields.includes(col)}
              style={{
                backgroundColor: disableFields.includes(col) ? '#d3d3d3' : 'white',
              }}
            >
              <option value="">{placeholders[col]}</option>
              {AQ_OPTIONS.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : col === 'AA' ? (
            <select
              name="AA"
              value={additionalInputs.AA || ""}
              onChange={(e) => setAdditionalInputs({ ...additionalInputs, AA: e.target.value })}
              disabled={disableFields.includes(col)}
              style={{
                backgroundColor: disableFields.includes(col) ? '#d3d3d3' : 'white',
              }}
            >
              <option value=""></option>
              {AA_OPTIONS.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : col === 'Y' ? (
            <input
              type="text"
              value={additionalInputs.Y}
              onChange={(e) => handlePostalCodeChange(e.target.value)}
              placeholder={placeholders[col]}
              disabled={disableFields.includes(col)}
              style={{
                backgroundColor: disableFields.includes(col) ? '#d3d3d3' : 'white',
              }}
            />
          ) : (
            <input
              type="text"
              value={additionalInputs[col]}
              onChange={(e) =>
                setAdditionalInputs({ ...additionalInputs, [col]: e.target.value })
              }
              placeholder={placeholders[col]}
              disabled={disableFields.includes(col)}
              style={{
                backgroundColor: disableFields.includes(col) ? '#d3d3d3' : 'white',
              }}
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

