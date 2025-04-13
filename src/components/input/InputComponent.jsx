// InputComponent.jsx
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import SheetSelector from '../SheetSelector';
import InputStep1 from './InputStep1';
import InputStep2 from './InputStep2';
import EditForm from '../EditForm';
import RecentEntriesTable from '../RecentEntriesTable';
import AlertMessage from '../AlertMessage';
import SuccessOverlay from '../common/SuccessOverlay';
import DeleteModal from '../common/DeleteModal';
import {
  fetchSheetData,
  getSheetIds,
  initializeInputs,
  fetchRowData,
  appendSheetData,
  updateBatchData,
  deleteRow,
  getPlaceholders,
} from '../../utils/utils';

const InputComponent = ({ accessToken }) => {
  const [step, setStep] = useState(1);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputRowIndex, setInputRowIndex] = useState(null);
  const [additionalInputs, setAdditionalInputs] = useState(initializeInputs());
  const [disableFields, setDisableFields] = useState([]);
  const [akValue, setAkValue] = useState('');
  const [alValue, setAlValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetRowIndex, setDeleteTargetRowIndex] = useState(null);
  const placeholders = getPlaceholders();

  const fetchRecentEntries = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error(error);
      setAlertMessage('スプレッドシートの読み込みに失敗しました。');
    }
  }, [selectedSheet]);

  useEffect(() => {
    if (selectedSheet) fetchRecentEntries();
  }, [selectedSheet, fetchRecentEntries]);

  const handleInputSuccess = async (rowIndex, ak, al) => {
    setInputRowIndex(rowIndex);
    setAkValue(ak);
    setAlValue(al);
    setStep(2);
    fetchRecentEntries();
  };

  const handleBatchSubmitSuccess = () => {
    setSuccessMessage('反映が完了しました！');
    setTimeout(() => setSuccessMessage(null), 3000);
    setAdditionalInputs(initializeInputs());
    setStep(1);
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

  const handleShowDeleteModal = (rowIndex) => {
    setDeleteTargetRowIndex(rowIndex);
    setDeleteModalVisible(true);
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setDeleteTargetRowIndex(null);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsProcessing(true);
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

  return (
    <div>
      <AlertMessage message={alertMessage} isProcessing={isProcessing} />
      <SheetSelector sheetIds={getSheetIds()} selectedSheet={selectedSheet} setSelectedSheet={setSelectedSheet} />
      {step === 1 && selectedSheet && (
        <InputStep1
          selectedSheet={selectedSheet}
          inputValue={inputValue}
          setInputValue={setInputValue}
          setAlertMessage={setAlertMessage}
          setIsProcessing={setIsProcessing}
          handleInputSuccess={handleInputSuccess}
          accessToken={accessToken}
        />
      )}
      {step === 2 && (
        <InputStep2
          additionalInputs={additionalInputs}
          setAdditionalInputs={setAdditionalInputs}
          akValue={akValue}
          alValue={alValue}
          inputRowIndex={inputRowIndex}
          selectedSheet={selectedSheet}
          accessToken={accessToken}
          setAlertMessage={setAlertMessage}
          setIsProcessing={setIsProcessing}
          disableFields={disableFields}
          setDisableFields={setDisableFields}
          handleBatchSubmitSuccess={handleBatchSubmitSuccess}
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
      <SuccessOverlay message={successMessage} />
      <DeleteModal
        isVisible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default InputComponent;
