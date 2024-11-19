import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // axios をインポート
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
  processRecentEntries,
  appendSheetData,
  fetchRowData,
  updateBatchData,
} from './utils';

const InputComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');
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
  const [searchTerm, setSearchTerm] = useState(''); // 検索キーワード
  const [searchResults, setSearchResults] = useState([]); // 検索結果


  const placeholders = getPlaceholders();

const fetchRecentEntries = useCallback(async () => {
  try {
    setAlertMessage('読み込み中です...');

    // メインデータ (K:S列)
    const rows = await fetchSheetData(selectedSheet, '売上管理表', 'K:S');

    // 補足データ (AL列, AK列)
    const alData = await fetchSheetData(selectedSheet, '売上管理表', 'AL:AL');
    const akData = await fetchSheetData(selectedSheet, '売上管理表', 'AK:AK');
    const dapData = await fetchSheetData(selectedSheet, '売上管理表', 'D:AP');

    // 直近5件のデータを加工
    const processedEntries = rows.slice(-5).reverse().map((row, index) => ({
      index: rows.length - index, // 1-based index
      kColumn: row[0] || '',     // 出品名
      sColumn: row[8] || '',     // お届け先氏名
      alColumn: alData[rows.length - index - 1]?.[0] || '', // 発送代行ID
      akColumn: akData[rows.length - index - 1]?.[0] || '', // 在庫数
      dColumn: dapData[rows.length - index - 1]?.[0] || '', // 日付
      nColumn: dapData[rows.length - index - 1]?.[10] || '',     // 価格
      yColumn: dapData[rows.length - index - 1]?.[21] || '',     // 郵便番号
      xColumn: dapData[rows.length - index - 1]?.[20] || '',     // 都道府県
      wColumn: dapData[rows.length - index - 1]?.[19] || '',     // 市区町村
      tColumn: dapData[rows.length - index - 1]?.[16] || '',     // 住所1
      uColumn: dapData[rows.length - index - 1]?.[17] || '',     // 住所2
      apColumn: dapData[rows.length - index - 1]?.[38] || '',    // 担当者名
      aaColumn: dapData[rows.length - index - 1]?.[23] || '',    // Shops
    }));

    setRecentEntries(processedEntries);
    setAlertMessage(null);
  } catch (error) {
    setAlertMessage('データの読み込みに失敗しました。');
    console.error(error);
  }
}, [selectedSheet]);


  useEffect(() => {
    fetchRecentEntries();
  }, [fetchRecentEntries]);

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
    try {
      setIsProcessing(true);
      setAlertMessage('処理中です...');
      await updateBatchData(selectedSheet, '売上管理表', inputRowIndex, additionalInputs, accessToken);
      setAdditionalInputs(initializeInputs());
      setShowAdditionalInputs(false);
      fetchRecentEntries();
    } catch {
      setAlertMessage('追加データの反映に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (entry) => {
　  console.log('編集対象データ:', entry); // デバッグ用
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
    } catch {
      setAlertMessage('データの更新に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

const handleDeleteRow = async (rowIndex) => {
  console.log(`Deleting row: ${rowIndex}`); // デバッグ用
  setIsProcessing(true);
  setAlertMessage('削除処理中です...');

  const spreadsheetId = getSheetIds()[selectedSheet];
  const sheetName = '売上管理表';

  try {
    // スプレッドシートのメタデータからシートIDを取得
    const sheetResponse = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const sheet = sheetResponse.data.sheets.find((s) => s.properties.title === sheetName);
    if (!sheet) throw new Error(`Sheet with name "${sheetName}" not found`);
    const sheetId = sheet.properties.sheetId;

    // 行削除のリクエストを送信
    const request = {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0ベースなので -1
              endIndex: rowIndex, // 削除する行
            },
          },
        },
      ],
    };

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

    setAlertMessage(`行 ${rowIndex} が削除されました`);
    fetchRecentEntries(); // 削除後に最新データを取得
  } catch (error) {
    console.error('行削除エラー:', error);
    setAlertMessage('行の削除に失敗しました。');
  } finally {
    setIsProcessing(false);
    setTimeout(() => setAlertMessage(null), 3000);
  }
};


  return (
    <div>
      <AlertMessage message={alertMessage} isProcessing={isProcessing} />
      <SheetSelector sheetIds={getSheetIds()} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} />
      <InputField inputValue={inputValue} setInputValue={setInputValue} handleInput={handleInput} isProcessing={isProcessing} />
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
  　　　handleDeleteRow={handleDeleteRow} 
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


