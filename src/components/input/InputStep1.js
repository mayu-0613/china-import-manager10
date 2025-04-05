// InputStep1.js
import React from 'react';
import InputField from './InputField';
import { appendSheetData, fetchRowData, deleteRow } from '../utils/utils';

const InputStep1 = ({
  selectedSheet,
  inputValue,
  setInputValue,
  setAlertMessage,
  setIsProcessing,
  handleInputSuccess,
  accessToken,
}) => {
  const handleInput = async () => {
    try {
      setIsProcessing(true);
      setAlertMessage('処理中です...', false);

      const lastFilledRowIndex = await appendSheetData(
        selectedSheet,
        '売上管理表',
        'K',
        inputValue,
        accessToken
      );

      const [ak, al] = await fetchRowData(
        selectedSheet,
        '売上管理表',
        lastFilledRowIndex,
        'AK:AL'
      );

      if (ak === '-1') {
        await deleteRow(selectedSheet, lastFilledRowIndex, accessToken);
        setAlertMessage('在庫がありません', true);
        setTimeout(() => setAlertMessage(null), 3000);
        setIsProcessing(false);
        return;
      }

      if (!al) {
        await deleteRow(selectedSheet, lastFilledRowIndex, accessToken);
        setAlertMessage('出品名に誤りがあります。管理者にご連絡下さい。', true);
        setTimeout(() => setAlertMessage(null), 3000);
        setIsProcessing(false);
        return;
      }

      if (ak === '0') {
        setAlertMessage('在庫が0になりました！【出品停止】でご連絡お願いします】', false);
        setTimeout(() => setAlertMessage(null), 5000);
      }

      handleInputSuccess(lastFilledRowIndex, ak, al);
    } catch (error) {
      setAlertMessage('データの追加に失敗しました。', true);
      setTimeout(() => setAlertMessage(null), 3000);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <InputField
      inputValue={inputValue}
      setInputValue={setInputValue}
      handleInput={handleInput}
      isProcessing={false}
    />
  );
};

export default InputStep1;
