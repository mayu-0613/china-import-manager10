import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AlertMessage from './AlertMessage';
import SheetSelector from './SheetSelector';
import InputField from './InputField';
import AdditionalInputs from './AdditionalInputs';
import RecentEntriesTable from './RecentEntriesTable';
import { useNavigate } from 'react-router-dom';

import {
  initializeInputs,
  getSheetIds,
  getPlaceholders,
  fetchSheetData,
  appendSheetData,
  fetchRowData,
  updateBatchData,
} from '../utils/utils';

const InputComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState(null); 
  const [inputValue, setInputValue] = useState('');
  const [additionalInputs, setAdditionalInputs] = useState(initializeInputs());
  const [akValue, setAkValue] = useState('');
  const [alValue, setAlValue] = useState('');
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [inputRowIndex, setInputRowIndex] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [disableFields, setDisableFields] = useState([]);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const placeholders = getPlaceholders();
  const navigate = useNavigate();
  const validateInputs = () => {
    const { D, N, S, T, U, W, X, Y, AQ } = additionalInputs;
  
    console.log('Validating inputs:', { D, N, S, T, U, W, X, Y, AQ }); // デバッグ用
  
    if (S === 'らくらくメルカリ便' || S === 'ゆうパケットポスト') {
      if (!D || !N || !S || !AQ) {
        console.log('Validation failed: Required fields are missing.');
        setAlertMessage('必須項目が入力されていません。');
        return false;
      }
    } else {
      if (!D || !N || !S || !T || !W || !X || !Y || !AQ) {
        console.log('Validation failed: Required fields are missing.');
        setAlertMessage('必須項目が入力されていません。');
        return false;
      }
    }
  
    setAlertMessage(null); // エラーがない場合、アラートをクリア
    return true;
  };
  

const handleIdentifierChange = async (identifierValue) => {
  try {
    const response = await fetchSheetData(selectedSheet, '入庫管理表', 'X:Y');

    const rows = response || [];
    const matchedRow = rows.find((row) => row[0] === identifierValue); // X列で検索

    if (matchedRow) {
      setInputValue(matchedRow[1] || ''); // V列の値をセット
      return true; // 検索成功
    } else {
      setInputValue(''); // 出品名フィールドをクリア
      return false; // 検索失敗
    }
  } catch (error) {
    console.error('識別番号の検索に失敗:', error);
    return false; // エラー時も検索失敗として扱う
  }
};



const handleInput = async () => {
  try {
    setIsProcessing(true);
    setAlertMessage('処理中です...', false); // オレンジ（処理中）

    
   const { rowIndex, ak, al } = await appendSheetData(
     selectedSheet,
     '売上管理表',
     'K',
     inputValue,
     accessToken
   );

    // **在庫がない (AKが-1) の場合 → データ削除して処理を中断**
    if (ak === '-1') {
      await deleteRow(selectedSheet, rowIndex);
      setAlertMessage('在庫がありません😢', true); // 赤（エラー）
      setTimeout(() => setAlertMessage(null), 3000);
      setIsProcessing(false);
      return;
    }

    // **出品名が空白 (ALが空) の場合 → データ削除して処理を中断**
    if (!al) {
      await deleteRow(selectedSheet, rowIndex);
      setAlertMessage(
        '出品名に誤りがあります。訂正お願いします。もし分からない場合は管理者にご連絡下さい。',
        true
      ); // 赤（エラー）
      setTimeout(() => setAlertMessage(null), 5000);
      setIsProcessing(false);
      return;
    }

    // **在庫切れ (AKが0) の場合 → 5秒間オーバーレイで表示**
    if (ak === '0') {
      setSuccessMessage('在庫が0になりました✨');

      // **3秒後にアラートを消す**
      setTimeout(() => setSuccessMessage(null), 3000);
    }

    // 追加入力フィールドを表示
    setShowAdditionalInputs(true);
    setInputRowIndex(rowIndex);
    setAkValue(ak);
    setAlValue(al);
  } catch (error) {
    setAlertMessage(
      'データの追加に失敗しました。ページを更新して再度お試しください。何度も失敗する場合は管理者にご連絡下さい',
      true
    );
    setTimeout(() => setAlertMessage(null), 5000);
    console.error(error);
  } finally {
    setIsProcessing(false);
  }
};





const deleteRow = async (selectedSheet, rowIndex) => {
  try {
    const spreadsheetId = getSheetIds()[selectedSheet]; // スプレッドシートの ID 取得
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}`},
      }
    );

    // 指定したシート名に対応する sheetId を取得
    const sheet = response.data.sheets.find(s => s.properties.title === "売上管理表");
    if (!sheet) {
      console.error('シート「売上管理表」が見つかりません');
      return;
    }

    const sheetId = sheet.properties.sheetId;

    if (!sheetId) {
      console.error('シート ID が取得できませんでした');
      return;
    }

    if (rowIndex <= 1) {
      console.error("削除対象の行番号が不正です", rowIndex);
      return;
    }

    const request = {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // Google Sheets のインデックスは 0 から
              endIndex: rowIndex,
            },
          },
        },
      ],
    };

    console.log('シート ID: ${sheetId}, 削除対象行: ${rowIndex}');

    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      request,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`行 ${rowIndex} を削除しました`);
  } catch (error) {
    console.error(`行の削除に失敗しました:`, error);
  }
};







  const handleBatchSubmit = async () => {

  // 入力検証
  if (!validateInputs()) {
    return;  // バリデーションエラーがあれば処理を中断
  }

    try {
      setIsProcessing(true);
      setAlertMessage('処理中です...');
      await updateBatchData(selectedSheet, '売上管理表', inputRowIndex, additionalInputs, accessToken);
      setAdditionalInputs(initializeInputs());
      setShowAdditionalInputs(false);
      setSuccessMessage('反映が完了しました！');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowContinuePrompt(true); // ✅ モーダル表示
    } catch {
      setAlertMessage('追加データの反映に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
    setInputValue('');

  };

  const handleSetDeliveryType = (type) => {
    console.log('Setting delivery type:', type); // ボタン押下時のログ
    setAdditionalInputs((prev) => ({
      ...prev,
      S: type,
    }));
    setDisableFields(['T', 'U', 'W', 'X', 'Y']); // 無効化対象列を設定
    console.log('Disable fields:', ['T', 'U', 'W', 'X', 'Y']);
  };
  

    const handleEnableFields = () => {
      setDisableFields([]); // 無効化を解除
    };
    
    return (
      <div>
        {/* ✅ 処理中オーバーレイ（ぐるぐるスピナー） */}
        {isProcessing && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
          >
            {/* スピナー */}
            <div
              style={{
                width: '48px',
                height: '48px',
                border: '6px solid #ccc',
                borderTop: '6px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px',
              }}
            />
            <p style={{ fontSize: '20px', color: '#333' }}>
              処理中です…しばらくお待ちください
            </p>
            {/* スピナー用アニメーション定義 */}
            <style>{`
             @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
             }
           `}</style>

          </div>
        )}
    
        {/* ✅ 成功メッセージ */}
        {successMessage && (
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
            {successMessage}
          </div>
        )}
    
        {/* ✅ 通知・UI本体 */}
        <AlertMessage message={alertMessage} isProcessing={isProcessing} />
        <SheetSelector
          sheetIds={getSheetIds()}
          selectedSheet={selectedSheet}
          setSelectedSheet={setSelectedSheet}
        />
        {selectedSheet && (
          <InputField
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleInput={handleInput}
            isProcessing={isProcessing}
            handleIdentifierChange={handleIdentifierChange}
          />
        )}
        {showAdditionalInputs && (
          <div>
            <AdditionalInputs
              additionalInputs={additionalInputs}
              setAdditionalInputs={setAdditionalInputs}
              placeholders={placeholders}
              akValue={akValue}
              alValue={alValue}
              handleBatchSubmit={handleBatchSubmit}
              isProcessing={isProcessing}
              disableFields={disableFields}
              setDisableFields={setDisableFields}
            />
          </div>
        )}

{showContinuePrompt && (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1001,
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '300px',
      }}
    >
      <p style={{ fontSize: '18px', marginBottom: '20px' }}>
        反映が完了しました！続けて入力しますか？
      </p>
      <button
        onClick={() => setShowContinuePrompt(false)}
        style={{ marginRight: '15px' }}
      >
        はい（続けて入力）
      </button>
      <button
        onClick={() => {
          setShowContinuePrompt(false);
          navigate('/search', { state: { keyword: inputValue } });
        }}
      >
        いいえ（検索へ移動）
      </button>
    </div>
  </div>
)}

      </div>
    );
    
};

export default InputComponent;