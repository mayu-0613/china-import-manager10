import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AlertMessage from './AlertMessage';
import SheetSelector from './SheetSelector';
import InputField from './InputField';
import AdditionalInputs from './AdditionalInputs';
import RecentEntriesTable from './RecentEntriesTable';
import EditForm from './EditForm';
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
  const [recentEntries, setRecentEntries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [disableFields, setDisableFields] = useState([]);

  // 追加: 削除確認モーダル用の状態
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetRowIndex, setDeleteTargetRowIndex] = useState(null);

  const placeholders = getPlaceholders();







  // 最近のエントリを取得
  const fetchRecentEntries = useCallback(async () => {
    try {
      setAlertMessage('読み込み中です...');

      const rows = await fetchSheetData(selectedSheet, '売上管理表', 'K:S');
      const alData = await fetchSheetData(selectedSheet, '売上管理表', 'AL:AL');
      const amData = await fetchSheetData(selectedSheet, '売上管理表', 'AM:AM');
      const akData = await fetchSheetData(selectedSheet, '売上管理表', 'AK:AK');
      const dapData = await fetchSheetData(selectedSheet, '売上管理表', 'D:AQ');

      const processedEntries = rows.slice().reverse().map((row, index) => ({
        index: rows.length - index,
        kColumn: row[0] || '',
        sColumn: row[8] || '',
        alColumn: alData[rows.length - index - 1]?.[0] || '',
        amColumn: amData[rows.length - index - 1]?.[0] || '',
        akColumn: akData[rows.length - index - 1]?.[0] || '',
        dColumn: dapData[rows.length - index - 1]?.[0] || '',
        nColumn: dapData[rows.length - index - 1]?.[10] || '',
        yColumn: dapData[rows.length - index - 1]?.[21] || '',
        xColumn: dapData[rows.length - index - 1]?.[20] || '',
        wColumn: dapData[rows.length - index - 1]?.[19] || '',
        tColumn: dapData[rows.length - index - 1]?.[16] || '',
        uColumn: dapData[rows.length - index - 1]?.[17] || '',
        aqColumn: dapData[rows.length - index - 1]?.[39] || '',
        aaColumn: dapData[rows.length - index - 1]?.[23] || '',
      }));

      setRecentEntries(processedEntries);
      setAlertMessage(null);
    } catch (error) {
      setAlertMessage('スプレッドシートを選択してください');
      console.error(error);
    }
  }, [selectedSheet]);

  useEffect(() => {
    fetchRecentEntries();
  }, [fetchRecentEntries]);

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

    // K列にデータを追加し、最後に入力された行のインデックスを取得
    const lastFilledRowIndex = await appendSheetData(selectedSheet, '売上管理表', 'K', inputValue, accessToken);

    // AK列とAL列のデータを取得
    const [ak, al] = await fetchRowData(selectedSheet, '売上管理表', lastFilledRowIndex, 'AK:AL');

    // **在庫がない (AKが-1) の場合 → データ削除して処理を中断**
    if (ak === '-1') {
      await deleteRow(selectedSheet, lastFilledRowIndex);
      setAlertMessage('在庫がありません', true); // 赤（エラー）
      setTimeout(() => setAlertMessage(null), 3000);
      setIsProcessing(false);
      return;
    }

    // **出品名が空白 (ALが空) の場合 → データ削除して処理を中断**
    if (!al) {
      await deleteRow(selectedSheet, lastFilledRowIndex);
      setAlertMessage('出品名に誤りがあります', true); // 赤（エラー）
      setTimeout(() => setAlertMessage(null), 3000);
      setIsProcessing(false);
      return;
    }

    // **在庫切れ (AKが0) の場合 → アラートを表示しつつ処理を継続**
    if (ak === '0') {
      setAlertMessage('在庫切れになりました', false); // グリーン（継続）
      setTimeout(() => setAlertMessage(null), 3000);
    }

    // 追加入力フィールドを表示
    setShowAdditionalInputs(true);
    setInputRowIndex(lastFilledRowIndex);
    setAkValue(ak);
    setAlValue(al);
    fetchRecentEntries();
  } catch (error) {
    setAlertMessage('データの追加に失敗しました。', true); // 赤（エラー）
    setTimeout(() => setAlertMessage(null), 3000);
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
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 指定したシート名に対応する `sheetId` を取得
    const sheet = response.data.sheets.find(s => s.properties.title === "売上管理表");
    if (!sheet) {
      console.error(`シート「売上管理表」が見つかりません`);
      return;
    }

    const sheetId = sheet.properties.sheetId;

    if (!sheetId) {
      console.error(`シート ID が取得できませんでした`);
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

    console.log(`シート ID: ${sheetId}, 削除対象行: ${rowIndex}`);

    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      request,
      {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      }
    );

    console.log(`行 ${rowIndex} を削除しました`);
  } catch (error) {
    console.error('行の削除に失敗しました:', error);
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
      fetchRecentEntries();
      setSuccessMessage('反映が完了しました！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setAlertMessage('追加データの反映に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
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
    


  const handleEdit = (entry) => {
    setEditingRowIndex(entry.index);
    setEditingData({
      D: entry.dColumn || '',
      N: entry.nColumn || '',
      S: entry.sColumn || '',
      Y: entry.yColumn || '',
      X: entry.xColumn || '',
      W: entry.wColumn || '',
      T: entry.tColumn || '',
      U: entry.uColumn || '',
      AQ: entry.aqColumn || '',
      AA: entry.aaColumn || '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      setIsProcessing(true);
      setAlertMessage('処理中です...');
      await updateBatchData(selectedSheet, '売上管理表', editingRowIndex, editingData, accessToken);
      setEditingRowIndex(null);
      fetchRecentEntries();
      setSuccessMessage('編集内容が保存されました！');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setAlertMessage('データの更新に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 削除モーダルの表示
  const handleShowDeleteModal = (rowIndex) => {
    setDeleteTargetRowIndex(rowIndex);
    setDeleteModalVisible(true);
  };

  // 削除モーダルで「はい」を選択
  const handleConfirmDelete = async () => {
    try {
      setIsProcessing(true);
      setAlertMessage('削除処理中です...');
      const spreadsheetId = getSheetIds()[selectedSheet];
      const sheetName = '売上管理表';

      const sheetResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const sheet = sheetResponse.data.sheets.find((s) => s.properties.title === sheetName);
      if (!sheet) throw new Error(`Sheet with name "${sheetName}" not found`);

      const request = {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: deleteTargetRowIndex - 1,
                endIndex: deleteTargetRowIndex,
              },
            },
          },
        ],
      };

      await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        request,
        {
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        }
      );

      setSuccessMessage('行の削除が完了しました！');
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchRecentEntries();
    } catch (error) {
      setAlertMessage('行の削除に失敗しました。');
      setTimeout(() => setSuccessMessage(null), 3000);
      console.error(error);
    } finally {
      setIsProcessing(false);
      setDeleteModalVisible(false);
    }
  };

  // 削除モーダルで「いいえ」を選択
  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteTargetRowIndex(null);
  };

  return (
    <div>
      {isDeleteModalVisible && (
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
          <button onClick={handleConfirmDelete}>はい</button>
          <button onClick={handleCancelDelete}>いいえ</button>
        </div>
      )}
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
      <AlertMessage message={alertMessage} isProcessing={isProcessing} />
      <SheetSelector sheetIds={getSheetIds()} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} />
      {selectedSheet && (
        <InputField
          inputValue={inputValue}
          setInputValue={setInputValue}
          handleInput={handleInput}
          isProcessing={isProcessing}
          handleIdentifierChange={handleIdentifierChange} // 追加
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
        disableFields={disableFields} // 無効化フラグを渡す
        setDisableFields={setDisableFields} // ここで渡す
      />

    </div>
      )}
      <RecentEntriesTable
        recentEntries={recentEntries}
        handleEdit={handleEdit}
        handleDeleteRow={handleShowDeleteModal}
        isProcessing={isProcessing}
      />
      {editingRowIndex !== null && (
        <EditForm
          editingData={editingData}
          setEditingData={setEditingData}
          placeholders={placeholders}
          handleSaveEdit={handleSaveEdit}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default InputComponent;

