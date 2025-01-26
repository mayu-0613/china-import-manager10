import React, { useState } from 'react';
import axios from 'axios';
import './DisplayComponent.css';
import { updateBatchData } from './utils';
import Papa from 'papaparse'; // ファイルの先頭に追加
import { getDropdownOptions } from './utils'; // 必要な箇所に追加
import { AQ_OPTIONS } from './utils';



const DisplayComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');
  const [data, setData] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedShippingCostMin, setSelectedShippingCostMin] = useState('');
  const [selectedShippingCostMax, setSelectedShippingCostMax] = useState('');
  const [excludeBlankShippingCost, setExcludeBlankShippingCost] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editedShippingCosts, setEditedShippingCosts] = useState({});
  const [csvData, setCsvData] = useState([]);
  const [kColumnData, setKColumnData] = useState([]);
  const [matchCount, setMatchCount] = useState(0);
  const [ngCount, setNgCount] = useState(0);
  const [aqColumnData, setAqColumnData] = useState([]); // AQ列データ
  

  const handleEditShippingCost = (rowIndex, value) => {
    setEditedShippingCosts((prev) => ({
      ...prev,
      [rowIndex]: value,
    }));
  };

  
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (result) => {
          console.log('CSV読み込み結果:', result.data); // デバッグ
          setCsvData(result.data);
          setStatusMessage('CSVの読み込みが完了しました。');
        },
      });
    }
  };
  

  const fetchKColumnData = async () => {
    const spreadsheetId = sheetIds[selectedSheet];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/売上管理表!K:K?key=${apiKey}`;
  
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setKColumnData(response.data.values.slice(1)); // ヘッダーを除外
      setStatusMessage('K列データの取得が完了しました。');
    } catch (error) {
      console.error('K列のデータ取得に失敗:', error);
      setStatusMessage('K列のデータ取得に失敗しました。');
    }
  };

  const handleMatchCheck = () => {
    console.log('一致チェックボタンが押されました'); // ボタン動作確認
    console.log('CSVデータ:', csvData);
    console.log('K列データ:', kColumnData);
    

    if (!kColumnData.length || !csvData.length) {
      setStatusMessage('K列データまたはCSVデータが不足しています。');
      return;
    }
  
    let match = 0;
    let ng = 0;
  
    csvData.forEach((row) => {
      const itemName = row[5]?.trim(); // CSVのF列 (0-based indexで5番目)
      const isMatch = kColumnData.some((kValue) => kValue[0]?.trim() === itemName);
      console.log(`CSV出品名: ${itemName}, 一致: ${isMatch}`);
    });
    
  
    setMatchCount(match);
    setNgCount(ng);
    setStatusMessage(`チェック完了: 一致 ${match}件, NG ${ng}件`);
  };
  
  

  const updateSheetData = async (rowIndex, value) => {
    const spreadsheetId = sheetIds[selectedSheet];
    const range = `売上管理表!BJ${rowIndex + 3}`;  
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

    const requestBody = {
        values: [[value]]
    };

    try {
        const response = await axios.put(url, requestBody, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 200) {
            setStatusMessage('スプレッドシートが正常に更新されました！');
        } else {
            setStatusMessage('データの更新が失敗しました。');
        }
    } catch (error) {
        console.error('エラー詳細:', error.response?.data);
        setStatusMessage('エラー: スプレッドシートの更新に失敗しました。');
    }
};




  const years = ['2023', '2024', '2025'];
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

  const sheetIds = {
    '130未来物販': process.env.REACT_APP_SPREADSHEET_ID_130,
    '20なちさん': process.env.REACT_APP_SPREADSHEET_ID_20,
    '76岩木さん': process.env.REACT_APP_SPREADSHEET_ID_76,
    '190黒田さん': process.env.REACT_APP_SPREADSHEET_ID_190,
  };

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;
  const rowsPerPage = 20;
  const columnsToDisplay = [3, 8, 9, 10, 13, 18, 19, 20, 22, 23, 24, 26, 36, 37, 38, 39, 40, 41, 49, 50, 51, 52, 53, 55, 57, 60, 61, 62, 65, 67, 76, 77, 78, 79];

  const formatDate = (dateString) => {
    try {
      const dateParts = dateString.split('/');
      if (dateParts.length === 3) {
        const [year, month] = dateParts;
        return `${year}-${month.padStart(2, '0')}`;
      }
      return '';
    } catch (error) {
      console.error('日付の解析に失敗しました:', dateString);
      return '';
    }
  };

  const fetchData = async () => {
    setIsProcessing(true);
    setStatusMessage('データ取得中です...');
    const spreadsheetId = sheetIds[selectedSheet];
    const mainRange = '売上管理表!A2:CB1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${mainRange}?key=${apiKey}`;
  
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const allData = response.data.values;
  
      const filteredData = allData.slice(2).filter((row) => {
        const shippingCostText = row[61]?.replace(/[^0-9.]/g, '').trim();
        const shippingCost = shippingCostText ? parseFloat(shippingCostText) : NaN;
        const rowDate = formatDate(row[3]?.trim() || '');
  
        const dateMatch =
          selectedYear && selectedMonth
            ? rowDate === `${selectedYear}-${selectedMonth}`
            : selectedYear
            ? rowDate.startsWith(selectedYear)
            : selectedMonth
            ? rowDate.endsWith(`-${selectedMonth}`)
            : true;
  
        const excludeBlankMatch =
          excludeBlankShippingCost
            ? shippingCostText && !isNaN(shippingCost) && shippingCost > 0
            : true;
  
        return (
          dateMatch &&
          (selectedPerson ? row[42]?.trim() === selectedPerson.trim() : true) && // AQ列 (42番目)
          (selectedShippingCostMin !== ''
            ? shippingCost >= parseFloat(selectedShippingCostMin)
            : true) &&
          (selectedShippingCostMax !== ''
            ? shippingCost <= parseFloat(selectedShippingCostMax)
            : true)
        );
      });
  
      setData([allData[0], ...filteredData]);
      setCurrentPage(0);
      setStatusMessage(`データ取得完了！ 件数: ${filteredData.length}`);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatusMessage('データの取得に失敗しました。');
    } finally {
      setIsProcessing(false);
    }
  };
  




const handleSaveShippingCost = async (rowIndex) => {
  setIsProcessing(true);
  setStatusMessage('データ更新中です...');
  try {
      await updateBatchData(
          selectedSheet,
          '売上管理表',
          currentPage * rowsPerPage + rowIndex + 3, // 3行目以降の補正
          { BJ: editedShippingCosts[rowIndex] }, 
          accessToken
      );
      fetchData();  // データの再取得
      setStatusMessage('データの更新が完了しました！');
  } catch (error) {
      setStatusMessage('データの更新に失敗しました。');
      console.error('Error updating data:', error);
  } finally {
      setIsProcessing(false);
  }
};









const paginatedData = data.slice(1).slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

return (
  <div className="container">
    {statusMessage && <div className="status-message">{statusMessage}</div>}

    <h1>売上管理システム - 表示タブ</h1>

    <div className="filter-box">
      <label>データ件数: {data.length - 1}</label>
      <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>{sheetName}</option>
        ))}
      </select>

      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
        <option value="">年を選択</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
        <option value="">月を選択</option>
        {months.map(month => (
          <option key={month} value={month}>{month}</option>
        ))}
      </select>

      <select
  value={selectedPerson}
  onChange={(e) => setSelectedPerson(e.target.value)}
>
  <option value="">担当者を選択</option>
  {AQ_OPTIONS.map((person, index) => (
    <option key={index} value={person}>
      {person}
    </option>
  ))}
</select>

      <input type="number" value={selectedShippingCostMin} onChange={(e) => setSelectedShippingCostMin(e.target.value)} placeholder="送料 (最小円)" />
      <input type="number" value={selectedShippingCostMax} onChange={(e) => setSelectedShippingCostMax(e.target.value)} placeholder="送料 (最大円)" />
      <input type="checkbox" checked={excludeBlankShippingCost} onChange={(e) => setExcludeBlankShippingCost(e.target.checked)} /> 空白は除く 

      <button className="fetch-button" onClick={fetchData} disabled={isProcessing}>データを取得</button>
    </div>



{/* CSVアップロードと一致チェック */}
<div className="csv-upload">
  <label>CSVをアップロード:</label>
  <input type="file" accept=".csv" onChange={handleCsvUpload} />
  <button onClick={handleMatchCheck} disabled={!csvData.length || !kColumnData.length}>
    一致チェック
  </button>
</div>

{/* 一致チェック結果 */}
<div className="result-box">
  <h3>チェック結果:</h3>
  <p>一致件数: {matchCount}</p>
  <p>NG件数: {ngCount}</p>
</div>


    {data.length > 0 && (
      <div>
        <table className="data-table">
          <thead>
            <tr>
              {columnsToDisplay.map((colIndex) => (
                <th key={colIndex}>{data[0][colIndex]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                {columnsToDisplay.map((colIndex) => (
                  <td key={colIndex} style={{ width: '150px' }}>
                    {colIndex === 61 ? (
                      <input
                        type="text"
                        style={{ width: '150px' }}
                        value={editedShippingCosts[index] || row[61] || ''}
                        onChange={(e) => handleEditShippingCost(index, e.target.value)}
                        onBlur={() => handleSaveShippingCost(index)}
                      />
                    ) : (
                      row[colIndex]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)}>前へ</button>
          <span>ページ {currentPage + 1} / {Math.ceil((data.length - 1) / rowsPerPage)}</span>
          <button disabled={(currentPage + 1) * rowsPerPage >= data.length - 1} onClick={() => setCurrentPage(currentPage + 1)}>次へ</button>
        </div>
      </div>
    )}
  </div>
);


};

export default DisplayComponent;
