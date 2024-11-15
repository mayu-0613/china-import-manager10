import React, { useState, useEffect, useCallback }  from 'react'; 
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';

const InputComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');
  const [inputValue, setInputValue] = useState('');
  const [additionalInputs, setAdditionalInputs] = useState({
    D: '',
    N: '',
    S: '',
    Y: '',
    X: '',
    W: '',
    T: '',
    U: '',
    AP: '',
    AA: '',
  });
  const [akValue, setAkValue] = useState('');
  const [alValue, setAlValue] = useState('');
  const [showAdditionalInputs, setShowAdditionalInputs] = useState(false);
  const [inputRowIndex, setInputRowIndex] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const sheetIds = {
    '130未来物販': process.env.REACT_APP_SPREADSHEET_ID_130,
    '20なちさん': process.env.REACT_APP_SPREADSHEET_ID_20,
    '76岩木さん': process.env.REACT_APP_SPREADSHEET_ID_76,
    '190黒田さん': process.env.REACT_APP_SPREADSHEET_ID_190,
  };

  const placeholders = {
    D: '注文日を入力してください',
    N: '価格を入力してください',
    S: 'お届け先氏名を入力してください(メルカリ便希望の場合はこちらへ内容を入力してください。)',
    Y: 'お届け先郵便番号を入力してください',
    X: 'お届け先都道府県を入力してください',
    W: 'お届け先市区町村を入力してください',
    T: 'お届け先住所1を入力してください',
    U: 'お届け先住所2を入力してください',
    AP: '担当者名を入力してください',
    AA: '空白 or Shopsを選択してください',
  };

const fetchRecentEntries = useCallback(async () => {
    setAlertMessage('読み込み中です...');
    const spreadsheetId = sheetIds[selectedSheet];
    const sheetName = '売上管理表';
    const range = `${sheetName}!K:S`;

    try {

        // 1. KからS列を取得
        const response = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${process.env.REACT_APP_GOOGLE_API_KEY}&majorDimension=ROWS`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        // 2. AL列とAK列のデータを取得
        const alResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!AL:AL?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        const akResponse = await axios.get(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!AK:AK?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );


        const rows = response.data.values || [];
        const alRows = alResponse.data.values || [];
        const akRows = akResponse.data.values || [];

        const recentRows = rows.slice(-5).reverse().map((row, index) => ({
            index: rows.length - index,
            kColumn: row[0] || '',
            sColumn: row[8] || '',
            alColumn: alRows[rows.length - index - 1] ? alRows[rows.length - index - 1][0] : '',
            akColumn: akRows[rows.length - index - 1] ? akRows[rows.length - index - 1][0] : '',  // AK列を追加
        }));


        setRecentEntries(recentRows);
        setAlertMessage(null); // 読み込み完了後アラートを消す
    } catch (error) {
        console.error('Error fetching recent entries:', error);
        setAlertMessage('データの読み込みに失敗しました。');
    }
},[selectedSheet, accessToken]);

  useEffect(() => {
    fetchRecentEntries();
  }, [fetchRecentEntries]);

  const handleInput = async () => {
    setIsProcessing(true);
    setAlertMessage('処理中です...');
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

      setAlertMessage('売上管理表のK列の末尾にデータが追加されました！');
      setShowAdditionalInputs(true);
      setInputRowIndex(lastFilledRowIndex);

      const akAlRange = `${sheetName}!AK${lastFilledRowIndex}:AL${lastFilledRowIndex}`;
      const akAlResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(akAlRange)}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const [akData = '', alData = ''] = akAlResponse.data.values ? akAlResponse.data.values[0] : ['', ''];
      setAkValue(akData);
      setAlValue(alData);

      fetchRecentEntries();
    } catch (error) {
      console.error('Error adding data:', error.response ? error.response.data : error.message);
      setAlertMessage('データの追加に失敗しました。');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleDeleteRow = async (rowIndex) => {
    setIsProcessing(true);
    setAlertMessage('削除処理中です...');
    const spreadsheetId = sheetIds[selectedSheet];
    const sheetName = '売上管理表';
    const columnsToDelete = ['D', 'K', 'S', 'N', 'Y', 'X', 'W', 'T', 'U', 'AP', 'AA'];

    try {
      for (const col of columnsToDelete) {
        const targetRange = `${sheetName}!${col}${rowIndex}`;
        await axios.put(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetRange)}?valueInputOption=USER_ENTERED`,
          { values: [['']] },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }
      setAlertMessage(`行 ${rowIndex} のデータが削除されました`);
      fetchRecentEntries();
    } catch (error) {
      console.error('Error deleting row data:', error);
      setAlertMessage('データの削除に失敗しました。');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleBatchSubmit = async () => {
    setIsProcessing(true);
    setAlertMessage('処理中です...');
    const spreadsheetId = sheetIds[selectedSheet];
    const sheetName = '売上管理表';

    if (!inputRowIndex) {
      setAlertMessage('入力行番号が取得できていません。最初にK列にデータを入力してください。');
      setIsProcessing(false);
      setTimeout(() => setAlertMessage(null), 3000);
      return;
    }

    try {
      const columns = ['D', 'S', 'N', 'Y', 'X', 'W', 'T', 'U', 'AP', 'AA'];

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

      setAlertMessage('売上管理表に追加のデータが反映されました！');
      setAdditionalInputs({
        D: '',
        S: '',
        N: '',
        Y: '',
        X: '',
        W: '',
        T: '',
        U: '',
        AP: '',
        AA: '',
      });
      setShowAdditionalInputs(false);
      setInputRowIndex(null);
      fetchRecentEntries();
    } catch (error) {
      console.error('Error adding data:', error.response ? error.response.data : error.message);
      setAlertMessage('追加データの反映に失敗しました。');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

const handlePostalCodeInputChange = (e) => {
    let postalCode = e.target.value.replace(/-/g, ''); // ハイフンを削除
    if (postalCode.length > 3) {
        postalCode = postalCode.slice(0, 3) + '-' + postalCode.slice(3); // 前3桁の後にハイフンを追加
    }
    handlePostalCodeChange(postalCode.replace(/-/g, '')); // 郵便番号変更の関数を呼び出し、ハイフンを削除した値を渡す
    setAdditionalInputs((prev) => ({
        ...prev,
        Y: postalCode,
    }));
};


const [editingRowIndex, setEditingRowIndex] = useState(null); // 編集する行のインデックス
const [editingData, setEditingData] = useState({}); // 編集用データ

const handleEdit = (entry) => {
  setEditingRowIndex(entry.index); // 編集する行のインデックス
  setEditingData({
    D: entry.kColumn,  // 例: 出品名
    N: entry.sColumn,  // 例: 価格
    S: entry.alColumn, // 例: 発送代行ID
    Y: entry.akColumn, // 例: 在庫数
    X: entry.sColumn,  // 例: お届け先氏名
    W: entry.sColumn,  // 例: 住所1
    T: entry.sColumn,  // 例: 住所2
    U: entry.sColumn,  // 例: 空欄
    AP: entry.sColumn, // 例: 担当者名
    AA: entry.sColumn, // 例: Shops
  });
};

const handleSaveEdit = async () => {
  setIsProcessing(true);
  setAlertMessage('処理中です...');
  const spreadsheetId = sheetIds[selectedSheet];
  const sheetName = '売上管理表';

  try {
    const columns = ['D', 'S', 'N', 'Y', 'X', 'W', 'T', 'U', 'AP', 'AA'];

    for (const col of columns) {
      const targetRange = `${sheetName}!${col}${editingRowIndex}`;
      const value = editingData[col] ? [[editingData[col]]] : [['']];

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

    setAlertMessage('データが更新されました！');
    setEditingRowIndex(null); // 編集モードを解除
    fetchRecentEntries(); // 最新のデータを再読み込み
  } catch (error) {
    console.error('Error saving edit:', error.response ? error.response.data : error.message);
    setAlertMessage('データの更新に失敗しました。');
  } finally {
    setIsProcessing(false);
    setTimeout(() => setAlertMessage(null), 3000);
  }
};






  const handlePostalCodeChange = async (postalCode) => {
    setAdditionalInputs({ ...additionalInputs, Y: postalCode });

    if (postalCode.length === 7) {
      try {
        const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
        const address = response.data.results[0];
        setAdditionalInputs((prev) => ({
          ...prev,
          X: address.address1 || '',
          W: address.address2 || '',
          T: address.address3 || '',
        }));
      } catch (error) {
        console.error('Error fetching address from postal code:', error);
      }
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/,/g, ''); // カンマを削除
    setAdditionalInputs((prev) => ({
      ...prev,
      N: value,
    }));
  };


  return (
    <div>
      {alertMessage && (
        <div
          style={{
            padding: '10px',
            backgroundColor: isProcessing ? 'orange' : 'lightgreen',
            color: 'black',
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: '5px',
            marginBottom: '15px',
          }}
        >
          {alertMessage}
        </div>
      )}

      <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', whiteSpace: 'nowrap' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="出品名"
        />
        <button onClick={handleInput} disabled={isProcessing}>入力</button>
      </div>

      {showAdditionalInputs && (
        <div style={{ marginBottom: '10px' }}>
          <p><strong>在庫数:</strong> {akValue}</p>
          <p><strong>発送代行ID:</strong> {alValue}</p>
        </div>
      )}

      {showAdditionalInputs && (
        <div>
          <h3>追加のデータを入力してください</h3>
          {Object.keys(additionalInputs).map((col) => (
            <div key={col} className="additional-input">
              {col === 'D' ? (
                <DatePicker
                  selected={additionalInputs.D ? new Date(additionalInputs.D) : null}
                  onChange={(date) => setAdditionalInputs({ ...additionalInputs, D: format(date, 'yyyy/MM/dd') })}
                  dateFormat="yyyy/MM/dd"
                  placeholderText="注文日を選択してください"
                />
              ) : col === 'Y' ? (
                <input
                  type="text"
                  name={col}
                  value={additionalInputs[col]}
                  onChange={handlePostalCodeInputChange} // ハイフン削除を実行
                  placeholder={placeholders[col]}
                />
              ) : col === 'N' ? (
                <input
                  type="text"
                  name={col}
                  value={additionalInputs[col]}
                  onChange={handlePriceChange}
                  placeholder={placeholders[col]}
                />
              ) : col === 'AA' ? (
                <select
                  name={col}
                  value={additionalInputs[col]}
                  onChange={(e) => setAdditionalInputs({ ...additionalInputs, [col]: e.target.value })}
                >
                  <option value=""></option>
                  <option value="Shops">Shops</option>
                </select>
              ) : col === 'AP' ? (
                <select
                  name={col}
                  value={additionalInputs[col]}
                  onChange={(e) => setAdditionalInputs({ ...additionalInputs, [col]: e.target.value })}
                >
                  <option value="">担当者名を選択</option>
                  <option value="矢崎">矢崎</option>
                  <option value="奥村">奥村</option>
                  <option value="森栄">森栄</option>
                  <option value="新野">新野</option>
                  <option value="冨永">冨永</option>
                  <option value="千田">千田</option>
                  <option value="阿部">阿部</option>
                  <option value="石橋">石橋</option>
                </select>
              ) : (
                <input
                  type="text"
                  name={col}
                  value={additionalInputs[col]}
                  onChange={(e) => setAdditionalInputs({ ...additionalInputs, [col]: e.target.value })}
                  placeholder={placeholders[col]}
                />
              )}
            </div>
          ))}
          <button onClick={handleBatchSubmit} disabled={isProcessing}>一括反映</button>
        </div>
      )}

      <h3>直近の入力データ（5件）</h3>
      <table>
        <thead>
          <tr>
            <th>削除</th>
            <th>出品名</th>
            <th>在庫数</th>
            <th>発送代行ID</th>
            <th>お届け先氏名</th>
          </tr>
        </thead>
        <tbody>
          {recentEntries.map((entry, index) => (
            <tr key={index}>
              <td>
                <button onClick={() => handleDeleteRow(entry.index)} disabled={isProcessing}>削除</button>
              </td>
              <td>{entry.kColumn}</td>
              <td>{entry.akColumn}</td>
              <td>{entry.alColumn}</td>
              <td>{entry.sColumn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InputComponent;
