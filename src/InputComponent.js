import React, { useState } from 'react';
import axios from 'axios';

const InputComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');
  const [inputValue, setInputValue] = useState('');
  const [additionalInputs, setAdditionalInputs] = useState({
    D: '',
    S: '',
    N: '',
    Y: '',
    X: '',
    W: '',
    T: '',
    U: '',
    AA: '',
    AP: '',
  });
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [inputRowIndex, setInputRowIndex] = useState(null);
  const [akValue, setAkValue] = useState(''); // AK列のデータを保存
  const [alValue, setAlValue] = useState(''); // AL列のデータを保存

  const sheetIds = {
    '130未来物販': '1p44UmyhbrEweW-gNa4Dwc3-KMAAFgP1By4n3_kMC1oo',
    '20なちさん': '1MEnEv2Myp4wXyvFq_WK4dtVZcqmouxtswsKLnFhrmEg',
    '76岩木さん': '1BF4530kjkPKGD-zYku0m1ouRc8mBLQd-rd6zCVU7vOk',
    '190黒田さん': '1LawnuAky6z2WAoNTBYh_HSSfCFxTdzg65ajICrNvFCI',
  };

  const placeholders = {
    D: '注文日を入力してください',
    S: 'お届け先氏名を入力してください',
    N: '価格を入力してください',
    Y: 'お届け先郵便番号を入力してください',
    X: 'お届け先都道府県を入力してください',
    W: 'お届け先市区町村を入力してください',
    T: 'お届け先住所1を入力してください',
    U: 'お届け先住所2を入力してください',
    AA: '空白 or SHOSを入力してください',
    AP: 'を入力してください',
  };

  const handleInput = async () => {
    const spreadsheetId = sheetIds[selectedSheet];
    const sheetName = '売上管理表';
    const range = `${sheetName}!K:K`;

    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const rows = response.data.values || [];
      const lastFilledRowIndex = rows.length + 1;
      const targetRange = `${sheetName}!K${lastFilledRowIndex}`;

      await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
        {
          values: [[inputValue]],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // AK列とAL列の値を取得する
      const akAlRange = `${sheetName}!AK${lastFilledRowIndex}:AL${lastFilledRowIndex}`;
      const akAlResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(akAlRange)}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const akAlData = akAlResponse.data.values || [['', '']];
      setAkValue(akAlData[0][0] || ''); // AK列の値を保存
      setAlValue(akAlData[0][1] || ''); // AL列の値を保存

      alert('売上管理表のK列の末尾にデータが追加されました！');
      setShowAdditionalInputs(true);
      setInputRowIndex(lastFilledRowIndex); // 入力した行番号を保持
    } catch (error) {
      console.error('Error adding data:', error.response ? error.response.data : error.message);
      alert('データの追加に失敗しました。');
    }
  };

  const handleAdditionalInputChange = (e) => {
    const { name, value } = e.target;
    setAdditionalInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBatchSubmit = async () => {
    const spreadsheetId = sheetIds[selectedSheet];
    const sheetName = '売上管理表';

    if (!inputRowIndex) {
      alert('入力行番号が取得できていません。最初にK列にデータを入力してください。');
      return;
    }

    try {
      const columns = ['D', 'S', 'N', 'Y', 'X', 'W', 'T', 'U', 'AA', 'AP'];

      for (const col of columns) {
        const targetRange = `${sheetName}!${col}${inputRowIndex}`;
        const value = additionalInputs[col] ? [[additionalInputs[col]]] : [['']];

        await axios.put(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
          { values: value },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      alert('売上管理表に追加のデータが反映されました！');
      setInputValue(''); // 最終反映時に入力値をリセット
      setAdditionalInputs({
        D: '',
        S: '',
        N: '',
        Y: '',
        X: '',
        W: '',
        T: '',
        U: '',
        AA: '',
        AP: '',
      });
      setShowAdditionalInputs(false);
      setInputRowIndex(null); // 入力行番号をリセット
      setAkValue(''); // AK列の値をリセット
      setAlValue(''); // AL列の値をリセット
    } catch (error) {
      console.error('Error adding data:', error.response ? error.response.data : error.message);
      alert('追加データの反映に失敗しました。');
    }
  };

  return (
    <div>
      <select
        value={selectedSheet}
        onChange={(e) => setSelectedSheet(e.target.value)}
      >
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="商品名"
      />
      <button onClick={handleInput}>入力</button>

      {showAdditionalInputs && (
        <div>
          <h3>取得したデータ</h3>
          <p>在庫数: {akValue}</p>
          <p>ID: {alValue}</p>

          <h3>追加のデータを入力してください</h3>
          {Object.keys(additionalInputs).map((col) => (
            <div key={col}>
              <input
                type="text"
                name={col}
                value={additionalInputs[col]}
                onChange={handleAdditionalInputChange}
                placeholder={placeholders[col] || `${col}列のデータを入力`}
              />
            </div>
          ))}
          <button onClick={handleBatchSubmit}>一括反映</button>
        </div>
      )}
    </div>
  );
};

export default InputComponent;

