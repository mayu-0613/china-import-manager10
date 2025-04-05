// InputStep2.js
import React from 'react';
import AdditionalInputs from './AdditionalInputs';
import { initializeInputs, updateBatchData } from '../utils/utils';

const InputStep2 = ({
  additionalInputs,
  setAdditionalInputs,
  akValue,
  alValue,
  inputRowIndex,
  selectedSheet,
  accessToken,
  setAlertMessage,
  setIsProcessing,
  disableFields,
  setDisableFields,
  handleBatchSubmitSuccess,
}) => {
  const validateInputs = () => {
    const { D, N, S, T, U, W, X, Y, AQ } = additionalInputs;
    if (S === 'らくらくメルカリ便' || S === 'ゆうパケットポスト') {
      if (!D || !N || !S || !AQ) {
        setAlertMessage('必須項目が入力されていません。');
        return false;
      }
    } else {
      if (!D || !N || !S || !T || !W || !X || !Y || !AQ) {
        setAlertMessage('必須項目が入力されていません。');
        return false;
      }
    }
    setAlertMessage(null);
    return true;
  };

  const handleBatchSubmit = async () => {
    if (!validateInputs()) return;
    try {
      setIsProcessing(true);
      setAlertMessage('処理中です...');
      await updateBatchData(
        selectedSheet,
        '売上管理表',
        inputRowIndex,
        additionalInputs,
        accessToken
      );
      handleBatchSubmitSuccess();
    } catch {
      setAlertMessage('追加データの反映に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdditionalInputs
      additionalInputs={additionalInputs}
      setAdditionalInputs={setAdditionalInputs}
      placeholders={{}} // 必要に応じて渡す
      akValue={akValue}
      alValue={alValue}
      handleBatchSubmit={handleBatchSubmit}
      isProcessing={false}
      disableFields={disableFields}
      setDisableFields={setDisableFields}
    />
  );
};

export default InputStep2;
