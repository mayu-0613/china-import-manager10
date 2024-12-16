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
} from './utils';

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
      const dapData = await fetchSheetData(selectedSheet, '売上管理表', 'D:AP');

      const processedEntries = rows.slice(-5).reverse().map((row, index) => ({
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
        apColumn: dapData[rows.length - index - 1]?.[38] || '',
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
  // 必須項目のバリデーション
  const { D, N, S, T, W, X, AP } = additionalInputs;

  // 追加入力項目が全て入力されているかを確認
  if (!D || !N || !S || !T || !W || !X || !AP) {
    setAlertMessage('必須項目が入力されていません。');
    return false;
  }

  // K列の入力は必須ではないため、エラーメッセージを表示しない
  return true;
};



const handleInput = async () => {

  try {
    setIsProcessing(true);
    setAlertMessage('処理中です...');
    const lastFilledRowIndex = await appendSheetData(selectedSheet, '売上管理表', 'K', inputValue, accessToken);
    setShowAdditionalInputs(true);
    setInputRowIndex(lastFilledRowIndex);
    const [ak, al] = await fetchRowData(selectedSheet, '売上管理表', lastFilledRowIndex, 'AK:AL');
    setAkValue(ak);
    setAlValue(al);
    fetchRecentEntries();
  } catch {
    setAlertMessage('データの追加に失敗しました。');
  } finally {
    setIsProcessing(false);
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
      AP: entry.apColumn || '',
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
        />
      )}
      {showAdditionalInputs && (
        <AdditionalInputs
          additionalInputs={additionalInputs}
          setAdditionalInputs={setAdditionalInputs}
          placeholders={placeholders}
          akValue={akValue}
          alValue={alValue}
          handleBatchSubmit={handleBatchSubmit}
          isProcessing={isProcessing}
        />
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


