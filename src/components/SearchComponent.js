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
      dataCache.current[selectedSheet] = response.data.values || [];
      finalizeProcess("検索キーワードを入力してください",true);
    } catch (error) {
      console.error("Error fetching data:", error);
      finalizeProcess("データ取得に失敗しました。", true);
    }
  };

  useEffect(() => {
    if (!dataCache.current[selectedSheet]) {
      fetchData();
    }
  }, [selectedSheet]);

  // ✅ 検索処理
  const handleSearch = () => {


    setIsProcessing(true);
    setIsWarning(false);
    setStatusMessage("検索中です...");

    const filteredRows = dataCache.current[selectedSheet].filter((row) =>
      row.some((cell) => cell.includes(searchTerm))
    );

    finalizeProcess(filteredRows.length > 0 ? "検索結果が見つかりました！" : "一致する結果が見つかりませんでした。");
    setResults(filteredRows);
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
            {results.map((row, index) => (
              <tr key={index}>
                <td><input type="checkbox" checked={row[43] === "TRUE"} readOnly /></td>
                <td style={{ backgroundColor: row[88] === "TRUE" ? "#d3d3d3" : "transparent" }}>
  <input
    type="checkbox"
    checked={row[44] === "TRUE"}
    readOnly
    disabled={row[88] === "TRUE"}
  />
</td>
      <td>
        <input type="checkbox" checked={row[88] === "TRUE"} readOnly />
      </td>
                <td>{row[38]}</td>
                <td>{row[40]}</td>
                <td>{row[41]}</td>
                <td>{row[3]}</td>
                <td>{row[10]}</td>
                <td>{row[13]}</td>
                <td>{row[18]}</td>
                <td>{row[24]}</td>
                <td>{row[23]}</td>
                <td>{row[22]}</td>
                <td>{row[19]}</td>
                <td>{row[20]}</td>
                <td>{row[26]}</td>
                <td>{row[36]}</td>
                <td>{row[37]}</td>
                <td>{row[42]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SearchComponent;
