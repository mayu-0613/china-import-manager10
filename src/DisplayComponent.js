import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DisplayComponent.css';
import { updateBatchData } from './utils';
import Papa from 'papaparse'; // ファイルの先頭に追加
import { getDropdownOptions } from './utils'; // 必要な箇所に追加
import { AQ_OPTIONS } from './utils';
import { getSheetIds } from './utils';  // ✅ utils.js からインポート




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
  const [matchResults, setMatchResults] = useState([]); // 一致結果を保存
  const [selectedKItem, setSelectedKItem] = useState(""); // 選択された K列の値
  const [kColumnOptions, setKColumnOptions] = useState([]); // K列の選択肢
  const [nColumnData, setNColumnData] = useState([]); // ✅ N列（売上） ← 追加！
  const [matchCountK, setMatchCountK] = useState(0); // K列（出品名）一致数
  const [ngCountK, setNgCountK] = useState(0);       // K列（出品名）不一致数
  const [matchCountN, setMatchCountN] = useState(0); // N列（売上）一致数
  const [ngCountN, setNgCountN] = useState(0);       // N列（売上）不一致数



  

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
            header: false, // ヘッダーを無視
            skipEmptyLines: true,
            complete: (result) => {
                const allData = result.data;

                // 1行目（タイトル行）をスキップ
                const dataWithoutHeader = allData.slice(1);

                console.log('CSVデータ（タイトル行をスキップ）:', dataWithoutHeader);
                setCsvData(dataWithoutHeader);
                setStatusMessage('CSVの読み込みが完了しました。');
            },
        });
    }
};


  
const fetchFilteredDColumnData = async () => {
  console.log("=== フィルタリング後の D列（購入日）データ取得開始 ===");
  setStatusMessage('D列（購入日）データ取得中...');

  const sheetIdMap = getSheetIds();
  let allDColumnData = [];

  const sheetsToFetch = selectedSheet === '全て' 
      ? Object.keys(sheetIdMap).filter(sheet => sheet !== '全て') 
      : [selectedSheet];

  console.log("取得対象のスプレッドシート:", sheetsToFetch);

  for (const sheet of sheetsToFetch) {
      const spreadsheetId = sheetIdMap[sheet];
      if (!spreadsheetId) continue;

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/売上管理表!D:D?key=${apiKey}`;

      try {
          const response = await axios.get(url, {
              headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.data || !response.data.values) {
              console.error(`⚠ D列（購入日）データが見つかりません: ${sheet}`);
              continue;
          }

          // ✅ D列のデータを取得（1行目のヘッダーを除外）
          const dColumnData = response.data.values.slice(1).map(row => row[0]?.trim()).filter(Boolean);

          console.log(`✅ 取得した D列（購入日）データ (${sheet}):`, dColumnData);
          allDColumnData = [...allDColumnData, ...dColumnData];

      } catch (error) {
          console.error(`⚠ D列（購入日）のデータ取得に失敗: ${sheet}`, error);
      }
  }

  console.log("📌 最終的に取得した D列（購入日）データ:", allDColumnData);
  return allDColumnData;
};



const fetchFilteredKColumnData = async () => {
    return await fetchFilteredColumnData(10); // K列（出品名）
};

const fetchFilteredNColumnData = async () => {
  return await fetchFilteredColumnData(13); // ✅ N列（売上）
};


const fetchFilteredBLColumnData = async () => {
    return await fetchFilteredColumnData(63); // BL列（メルカリ送料）
};

const fetchFilteredColumnData = async (columnIndex) => {
  console.log(`=== フィルタリング後の ${columnIndex}列データ取得開始 ===`);
  setStatusMessage(`${columnIndex}列データ取得中...`);

  const sheetIdMap = getSheetIds();
  let allColumnData = [];

  const sheetsToFetch = selectedSheet === '全て' 
      ? Object.keys(sheetIdMap).filter(sheet => sheet !== '全て') 
      : [selectedSheet];

  for (const sheet of sheetsToFetch) {
      const spreadsheetId = sheetIdMap[sheet];
      if (!spreadsheetId) continue;

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/売上管理表!A2:CB1000?key=${apiKey}`;

      try {
          const response = await axios.get(url, {
              headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!response.data || !response.data.values) {
              console.error(`${columnIndex}列データが見つかりません: ${sheet}`);
              continue;
          }

          const allData = response.data.values;

          const filteredColumnData = allData.slice(2).filter((row) => {
              const rowDate = formatDate(row[3]?.trim() || '');

              const dateMatch =
                  selectedYear && selectedMonth
                      ? rowDate === `${selectedYear}-${selectedMonth}`
                      : selectedYear
                      ? rowDate.startsWith(selectedYear)
                      : selectedMonth
                      ? rowDate.endsWith(`-${selectedMonth}`)
                      : true;

              return dateMatch;
          }).map(row => row[columnIndex]?.trim()).filter(Boolean);

          allColumnData = [...allColumnData, ...filteredColumnData];

      } catch (error) {
          console.error(`${columnIndex}列のデータ取得に失敗: ${sheet}`, error);
      }
  }

  console.log(`取得した全てのフィルタリング後の ${columnIndex}列データ:`, allColumnData);
  return allColumnData;
};

const formatCsvDate = (dateString) => {
  if (!dateString) return "";

  // 日付と時間がある場合、空白で分割して日付部分のみを取得
  const dateOnly = dateString.split(" ")[0];

  // `/` か `-` 区切りで分割
  const parts = dateOnly.includes("/") ? dateOnly.split("/") : dateOnly.split("-");

  if (parts.length === 3) {
    let [year, month, day] = parts;
    
    // 月と日を2桁に統一
    month = month.padStart(2, "0");
    day = day.padStart(2, "0");

    return `${year}/${month}/${day}`;  // YYYY/MM/DD に統一
  }
  
  return dateOnly; // 変換できない場合はそのまま
};


const filterByDate = (dateString) => {
  if (!dateString) return ""; // 日付がない場合は空文字を返す

  const parts = dateString.split(" ")[0].split("/"); // 時間を除去して `YYYY/MM/DD` に整形
  if (parts.length === 3) {
    const [year, month, day] = parts.map((part) => part.padStart(2, "0"));
    return `${year}/${month}/${day}`;
  }

  return dateString;
};

const handleMatchCheck = async () => {   
  console.log('=== 一致チェックボタンが押されました ===');

  setStatusMessage('スプレッドシートデータ取得中...');
  
  // ✅ 必要な列のデータを取得（フィルター適用）
  const fetchedDColumnData = await fetchFilteredDColumnData(); // スプレッドシートD列（日付）
  const fetchedKColumnData = await fetchFilteredKColumnData(); // スプレッドシートK列（出品名）
  const fetchedNColumnData = await fetchFilteredNColumnData(); // スプレッドシートN列（売上）
  const fetchedBLColumnData = await fetchFilteredBLColumnData(); // スプレッドシートBL列（送料）

  if (!csvData.length) {
    setStatusMessage('CSVデータがありません。CSVをアップロードしてください。');
    return;
  }

  if (!fetchedDColumnData.length || !fetchedKColumnData.length || !fetchedNColumnData.length || !fetchedBLColumnData.length) {
    setStatusMessage('スプレッドシートデータの取得に失敗しました。');
    return;
  }

  console.log("取得したフィルタリング後の D列（日付）データ:", fetchedDColumnData);
  console.log("取得したフィルタリング後の K列（出品名）データ:", fetchedKColumnData);
  console.log("取得したフィルタリング後の N列（売上）データ:", fetchedNColumnData);
  console.log("取得したフィルタリング後の BL列（送料）データ:", fetchedBLColumnData);

  let matchCount = 0;
  let ngCount = 0;
  let results = [];

  // ✅ CSVデータもスプレッドシートのフィルターと同じ条件で絞り込み
  const filteredCsvData = csvData.filter((row) => {
    const csvDate = formatCsvDate(row[1]?.trim() || ""); // CSVのB列（日付）
    const csvShipping = parseFloat(row[9]?.trim()) || 0; // J列（配送料）

    // ✅ フィルター適用
    const dateMatch = selectedYear && selectedMonth
      ? csvDate.startsWith(`${selectedYear}/${selectedMonth.padStart(2, '0')}`)
      : selectedYear
      ? csvDate.startsWith(selectedYear)
      : selectedMonth
      ? csvDate.includes(`/${selectedMonth.padStart(2, '0')}/`)
      : true;

    const shippingCostMatch = selectedShippingCostMin !== '' 
      ? csvShipping >= parseFloat(selectedShippingCostMin)
      : true &&
      selectedShippingCostMax !== ''
      ? csvShipping <= parseFloat(selectedShippingCostMax)
      : true;

    return dateMatch && shippingCostMatch;
  });

  console.log("フィルタリング後のCSVデータ:", filteredCsvData);

  // ✅ 一致チェック処理
  filteredCsvData.forEach((row, index) => {
    const csvDate = formatCsvDate(row[1]?.trim() || "");  // CSVのB列（日付）
    const csvItemName = row[5]?.trim() || "";  // CSVのF列（出品名）
    const csvPrice = parseFloat(row[7]?.trim()) || 0; // H列（商品代金）
    const csvShipping = parseFloat(row[9]?.trim()) || 0; // J列（配送料）

    // ✅ 各項目の比較結果
    const isDateMatch = fetchedDColumnData.some((dValue) => dValue?.trim() === csvDate.split(" ")[0]);
    const isItemMatch = fetchedKColumnData.some((kValue) => kValue?.trim() === csvItemName);
    const isPriceMatch = fetchedNColumnData.some((nValue) => parseFloat(nValue).toFixed(0) === csvPrice.toFixed(0));
    const isShippingMatch = fetchedBLColumnData.some((blValue) => {
      // ✅ スプレッドシートの送料 (BL列) を数値化（「￥」「,」を削除）
      let sheetShippingRaw = blValue;
      let sheetShipping = 
        blValue === undefined || blValue === "" || isNaN(parseFloat(blValue.replace(/[￥,]/g, '')))
          ? 0  // 空白・未定義・NaN の場合は 0
          : parseFloat(blValue.replace(/[￥,]/g, '')); // 数値変換（「￥」「,」を削除）
    
      // ✅ CSVの送料 (J列) も数値化
      let csvShippingFormatted = isNaN(parseFloat(csvShipping)) ? 0 : parseFloat(csvShipping);
    
      // ✅ デバッグログ (比較の詳細を表示)
      console.log(
        `🚀 送料比較 - スプレッドシート (元データ): "${sheetShippingRaw}" -> ${sheetShipping} (${typeof sheetShipping}), ` +
        `CSV: ${csvShipping} -> ${csvShippingFormatted} (${typeof csvShippingFormatted}), ` +
        `一致: ${sheetShipping === csvShippingFormatted}`
      );
    
      return sheetShipping === csvShippingFormatted; // 数値同士で比較
    });
    

    // ✅ すべての条件が一致したら「●」、不一致の項目を赤色に
    const isAllMatch = isDateMatch && isItemMatch && isPriceMatch && isShippingMatch;

    results.push({
      csvDate: { value: csvDate || "---", matched: isDateMatch },  
      csvItem: { value: csvItemName || "---", matched: isItemMatch },
      csvPrice: { value: isNaN(csvPrice) ? "---" : csvPrice.toFixed(0), matched: isPriceMatch },
      csvShipping: { value: isNaN(csvShipping) ? "---" : csvShipping.toFixed(0), matched: isShippingMatch },
      matched: isAllMatch,
    });

    if (isAllMatch) {
      matchCount++;
    } else {
      ngCount++;
    }
  });

  console.log(`最終結果 - 一致: ${matchCount}, 不一致: ${ngCount}`);

  setMatchResults(results);
  setMatchCount(matchCount);
  setNgCount(ngCount);
  setStatusMessage(`チェック完了: 一致 ${matchCount}件, NG ${ngCount}件`);
};













// ✅ 一致チェック時にK列のデータを取得するための関数
const fetchKColumnData = async () => {
  console.log("=== K列データ取得開始 ===");
  setStatusMessage('K列データ取得中...');

  const spreadsheetId = sheetIds[selectedSheet];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/売上管理表!K:K?key=${apiKey}`;

  try {
      const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.data || !response.data.values) {
          console.error("K列データが見つかりません");
          return [];
      }

      const fetchedKColumn = response.data.values.slice(1).map((row) => row[0]); // ヘッダーを除外
      console.log("取得したK列データ:", fetchedKColumn);
      return fetchedKColumn; // データを返す
  } catch (error) {
      console.error("K列のデータ取得に失敗:", error);
      setStatusMessage("K列のデータ取得に失敗しました。");
      return [];
  }
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

        // ✅ K列（出品名）のデータを取得
        const extractedKColumnData = allData.slice(2).map(row => row[10]?.trim()).filter(Boolean);
        setKColumnData(extractedKColumnData);
        console.log("取得したK列データ:", extractedKColumnData);

        // ✅ N列（売上）のデータを取得
        const extractedNColumnData = allData.slice(2).map(row => row[13]?.trim()).filter(Boolean);
        setNColumnData(extractedNColumnData);
        console.log("取得したN列データ:", extractedNColumnData);

        // ✅ データのフィルタリング（スプレッドシート側のフィルター）
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
  {Object.keys(getSheetIds()).map((sheetName) => (
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
  <button 
  onClick={async () => {
    console.log('✅ 一致チェックボタンが押されました - onClick 発火');
    await handleMatchCheck();
  }} 
  disabled={!csvData.length}
>
  一致チェック
</button>




</div>


{/* 一致チェック結果 */}
<div className="result-box">
  <h3>チェック結果:</h3>
  <p>出品名 一致件数: {matchCountK} / NG件数: {ngCountK}</p>
  <p>売上 一致件数: {matchCountN} / NG件数: {ngCountN}</p>
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
    

{/* 一致チェック結果のテーブル */}
<div className="result-details">
  <h3>一致チェック結果:</h3>
  <table className="match-table">
    <thead>
      <tr>
        <th>CSVの日付</th>
        <th>CSVの出品名</th>
        <th>CSVの売上</th>
        <th>CSVの送料</th>
        <th>一致</th>
      </tr>
    </thead>
    <tbody>
      {matchResults.map((result, index) => (
        <tr key={index}>
          <td style={{ backgroundColor: result.csvDate.matched ? 'transparent' : '#ffcccc' }}>
            {result.csvDate.value}
          </td>
          <td style={{ backgroundColor: result.csvItem.matched ? 'transparent' : '#ffcccc' }}>
            {result.csvItem.value}
          </td>
          <td style={{ backgroundColor: result.csvPrice.matched ? 'transparent' : '#ffcccc' }}>
            {result.csvPrice.value}
          </td>
          <td style={{ backgroundColor: result.csvShipping.matched ? 'transparent' : '#ffcccc' }}>
            {result.csvShipping.value}
          </td>
          <td style={{ textAlign: 'center' }}>
            {result.matched ? '●' : '×'}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>





  </div>
  
  
);



};

export default DisplayComponent;
