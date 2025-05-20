import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/index.css";
import AlertMessage from "../components/AlertMessage"; // ✅ AlertMessage をインポート

const SearchComponent = ({ accessToken }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("130未来物販");
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWarning, setIsWarning] = useState(false); // ✅ 追加
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editValues, setEditValues] = useState({});


  const dataCache = useRef({});

  const sheetIds = {
    "130未来物販": process.env.REACT_APP_SPREADSHEET_ID_130,
    "20なちさん": process.env.REACT_APP_SPREADSHEET_ID_20,
    "76岩木さん": process.env.REACT_APP_SPREADSHEET_ID_76,
    "190黒田さん": process.env.REACT_APP_SPREADSHEET_ID_190,
  };

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  // ✅ 共通の処理終了関数
  const finalizeProcess = (message = "", warning = false) => {
    setStatusMessage(message);
    setIsProcessing(false);
    setIsWarning(warning);
  };

  // API からデータを取得し、キャッシュする
  const fetchData = async () => {
    setIsProcessing(true);
    setStatusMessage("データを取得中...");
  
    const spreadsheetId = sheetIds[selectedSheet];
    const mainRange = "売上管理表!A2:CK10000";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${mainRange}?key=${apiKey}`;
  
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      const data = response.data.values || [];
  
      const numberedData = data.map((row, i) => ({
        rowIndexInSheet: i + 2,
        rowData: row,
      }));
  
      dataCache.current[selectedSheet] = numberedData;
    // データ取得成功時だけメッセージを出す
if (response.data && response.data.values?.length) {
  finalizeProcess("検索キーワードを入力してください", true);
} else {
  finalizeProcess("データ取得に失敗、または空のデータです。", true);
}

    } catch (error) {
      console.error("Error fetching data:", error);
      finalizeProcess("データ取得に失敗しました。", true);
    }
  };
  

  useEffect(() => {
    fetchData(); // キャッシュあっても強制実行
  }, [selectedSheet]);
  

  // ✅ 検索処理
const handleSearch = () => {
  setIsProcessing(true);
  setIsWarning(false);
  setStatusMessage("検索中です...");

  const rawData = dataCache.current[selectedSheet] || [];

  const filtered = rawData.filter(({ rowData }) =>
    rowData.some((cell) => cell.includes(searchTerm))
  );

  setResults(filtered); // results = [{ rowIndexInSheet, rowData }]
  finalizeProcess(filtered.length > 0 ? "検索結果が見つかりました！" : "一致する結果が見つかりませんでした。");
};


  const handleDelete = async (indexInResults) => {
  const confirmed = window.confirm("この行を削除しますか？");
  if (!confirmed) return;

  setIsProcessing(true);
  setStatusMessage("削除中...");

  const spreadsheetId = sheetIds[selectedSheet];
  const sheetRowIndex = results[indexInResults].rowIndexInSheet;

  try {
    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: await getSheetGid(spreadsheetId, "売上管理表"),
                dimension: "ROWS",
                startIndex: sheetRowIndex - 1, // 0-index に変換
                endIndex: sheetRowIndex,
              },
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 削除後、ローカルからも除外
    const newResults = [...results];
    newResults.splice(indexInResults, 1);
    setResults(newResults);
    finalizeProcess("削除しました！");
  } catch (error) {
    console.error(error);
    finalizeProcess("削除に失敗しました。", true);
  }
};


  const getSheetGid = async (spreadsheetId, sheetName) => {
    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const sheet = response.data.sheets.find(
        (s) => s.properties.title === sheetName
      );
      return sheet?.properties?.sheetId;
    } catch (error) {
      console.error("シートID取得に失敗しました", error);
      throw new Error("シートID取得失敗");
    }
  };
  
  
  // 編集モードに切り替え
  const handleEdit = (rowIndex) => {
    const row = results[rowIndex].rowData; // ✅ ← ここ重要！
    setEditingRowIndex(rowIndex);
    setEditValues({
      soldDate: row[3],
      itemName: row[10],
      price: row[13],
      recipient: row[18],
      zip: row[24],
      prefecture: row[23],
      city: row[22],
      address1: row[19],
      address2: row[20],
      shop: row[26],
      manager: row[42],
    });
  };
  

// 編集結果を保存（Sheets APIと連携するならここに記述）
const handleSaveEdit = async (rowIndex) => {
  setIsProcessing(true);
  setStatusMessage("保存中...");

  const spreadsheetId = sheetIds[selectedSheet];
  const rowNumber = results[rowIndex].rowIndexInSheet; // ✅ ←ここ修正

  const columnMap = {
    soldDate: 4,
    itemName: 11,
    price: 14,
    recipient: 19,
    address1: 20,
    address2: 21,
    city: 23,
    prefecture: 24,
    zip: 25,
    shop: 27,
    manager: 43,
  };

  try {
    const sheetId = await getSheetGid(spreadsheetId, "売上管理表");

    const requests = [];

    for (const [key, colNumber] of Object.entries(columnMap)) {
      requests.push({
        updateCells: {
          range: {
            sheetId: sheetId,
            startRowIndex: rowNumber - 1, // 0-index に変換
            endRowIndex: rowNumber,
            startColumnIndex: colNumber - 1,
            endColumnIndex: colNumber,
          },
          rows: [
            {
              values: [
                {
                  userEnteredValue: {
                    stringValue: editValues[key] || "",
                  },
                },
              ],
            },
          ],
          fields: "userEnteredValue",
        },
      });
    }

    await axios.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      { requests },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // ローカルにも反映
    const updatedResults = [...results];
    updatedResults[rowIndex][3] = editValues.soldDate || "";
    updatedResults[rowIndex][10] = editValues.itemName || "";
    updatedResults[rowIndex][13] = editValues.price || "";
    updatedResults[rowIndex][18] = editValues.recipient || "";
    updatedResults[rowIndex][19] = editValues.address1 || "";
    updatedResults[rowIndex][20] = editValues.address2 || "";
    updatedResults[rowIndex][22] = editValues.city || "";
    updatedResults[rowIndex][23] = editValues.prefecture || "";
    updatedResults[rowIndex][24] = editValues.zip || "";
    updatedResults[rowIndex][26] = editValues.shop || "";
    updatedResults[rowIndex][42] = editValues.manager || "";

    setResults(updatedResults);
    setEditingRowIndex(null);
    setEditValues({});
    finalizeProcess("更新が完了しました！");
  } catch (error) {
    console.error("スプレッドシート更新エラー:", error);
    finalizeProcess("保存に失敗しました。", true);
  }
};




  return (
    <div className="container">
      {/* ✅ AlertMessage を適用 */}
      {statusMessage && <AlertMessage message={statusMessage} isProcessing={isProcessing} isWarning={isWarning} />}

      <h1>売上管理システム</h1>
      <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>

      <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="検索キーワードを入力" />
      <button onClick={handleSearch} disabled={isProcessing}>検索</button>

      {results.length > 0 && (
  <table>
    <thead>
      <tr>
        <th>操作</th>
        <th>確認</th>
        <th>発送</th>
        <th>QR読み込み依頼</th>
        <th>発送日</th>
        <th>追跡番号</th>
        <th>配送会社</th>
        <th>日付</th>
        <th>商品名</th>
        <th>価格</th>
        <th>お届け先氏名</th>
        <th>お届け先郵便番号</th>
        <th>お届け先都道府県名</th>
        <th>お届け先市町村名</th>
        <th>お届け先住所1</th>
        <th>お届け先住所2</th>
        <th>Shops</th>
        <th>現在の在庫数</th>
        <th>発送代行ID</th>
        <th>担当者</th>
      </tr>
    </thead>
    <tbody>
      {results.map(({ rowData }, index) => (
        <tr key={index}>
          {/* ✅ 操作ボタン */}
          <td>
            {editingRowIndex === index ? (
              <>
                <button onClick={() => handleSaveEdit(index)}>保存</button>
                <button onClick={() => setEditingRowIndex(null)}>キャンセル</button>
              </>
            ) : (
              <>
                <button onClick={() => handleEdit(index)}>編集</button>
                <button onClick={() => handleDelete(index)}>削除</button>
              </>
            )}
          </td>

          {/* チェックボックス関連 */}
          <td><input type="checkbox" checked={rowData[43] === "TRUE"} readOnly /></td>
          <td style={{ backgroundColor: rowData[88] === "TRUE" ? "#d3d3d3" : "transparent" }}>
            <input type="checkbox" checked={rowData[44] === "TRUE"} readOnly disabled={rowData[88] === "TRUE"} />
          </td>
          <td style={{ backgroundColor: rowData[44] === "TRUE" ? "#d3d3d3" : "transparent" }}>
            <input type="checkbox" checked={rowData[88] === "TRUE"} readOnly disabled={rowData[44] === "TRUE"} />
          </td>

          {/* 非編集列 */}
          <td>{rowData[38]}</td>
          <td>{rowData[40]}</td>
          <td>{rowData[41]}</td>

          {/* 編集対応列（11項目） */}
          <td>{editingRowIndex === index ? <input value={editValues.soldDate || ""} onChange={(e) => setEditValues({ ...editValues, soldDate: e.target.value })} /> : rowData[3]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.itemName || ""} onChange={(e) => setEditValues({ ...editValues, itemName: e.target.value })} /> : rowData[10]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.price || ""} onChange={(e) => setEditValues({ ...editValues, price: e.target.value })} /> : rowData[13]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.recipient || ""} onChange={(e) => setEditValues({ ...editValues, recipient: e.target.value })} /> : rowData[18]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.zip || ""} onChange={(e) => setEditValues({ ...editValues, zip: e.target.value })} /> : rowData[24]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.prefecture || ""} onChange={(e) => setEditValues({ ...editValues, prefecture: e.target.value })} /> : rowData[23]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.city || ""} onChange={(e) => setEditValues({ ...editValues, city: e.target.value })} /> : rowData[22]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.address1 || ""} onChange={(e) => setEditValues({ ...editValues, address1: e.target.value })} /> : rowData[19]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.address2 || ""} onChange={(e) => setEditValues({ ...editValues, address2: e.target.value })} /> : rowData[20]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.shop || ""} onChange={(e) => setEditValues({ ...editValues, shop: e.target.value })} /> : rowData[26]}</td>

          {/* 非編集列 */}
          <td>{rowData[36]}</td>
          <td>{rowData[37]}</td>
          <td>{editingRowIndex === index ? <input value={editValues.manager || ""} onChange={(e) => setEditValues({ ...editValues, manager: e.target.value })} /> : rowData[42]}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}

    </div>
  );
};

export default SearchComponent;
