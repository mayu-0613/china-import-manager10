import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { getSheetIds, AQ_OPTIONS } from "./utils"; // ✅ スプレッドシート情報 & 担当者リストを取得

const sheetName = "売上管理表"; 
const years = Array.from({ length: 11 }, (_, i) => (2020 + i).toString()); // ✅ 2020〜2030の年を用意
const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString()); // ✅ 1〜12の月を用意

const ComparisonComponent = () => {
  const [spreadsheetData, setSpreadsheetData] = useState([]);
  const [filteredSpreadsheetData, setFilteredSpreadsheetData] = useState([]);
  const [filteredCsvData, setFilteredCsvData] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [unmatchedData, setUnmatchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ フィルター用のステート
  const [selectedSheet, setSelectedSheet] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");

  // ✅ CSVフィルター用のステート
  const [selectedCsvYear, setSelectedCsvYear] = useState("");
  const [selectedCsvMonth, setSelectedCsvMonth] = useState("");

  // ✅ スプレッドシートのデータ取得（全件取得）
  const fetchSpreadsheetData = async () => {
    setIsLoading(true);
    const sheetIds = getSheetIds();
    let allData = [];

    for (const [sheetKey, spreadsheetId] of Object.entries(sheetIds)) {
      if (!spreadsheetId) continue;

      try {
        const ranges = ["D", "K", "N", "BN"].map(col => `'${sheetName}'!${col}3:${col}`).join("&ranges=");
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
        const response = await axios.get(url);
        const [dates, names, prices, shipping] = response.data.valueRanges.map(range => range.values || []);

        // データ整形（全件取得）
        const formattedData = dates.map((row, index) => {
          const orderDate = row[0]?.trim() || "";
          return {
            id: `${spreadsheetId}-${index + 3}`,
            sheetName: sheetKey,
            date: orderDate,
            name: names[index]?.[0] || "",
            price: prices[index]?.[0] || "",
            shipping: shipping[index]?.[0] || "",
            year: orderDate ? new Date(orderDate).getFullYear().toString() : "",
            month: orderDate ? (new Date(orderDate).getMonth() + 1).toString() : "",
          };
        }).filter(row => row.date);

        allData = [...allData, ...formattedData];
      } catch (error) {
        console.error("スプレッドシートデータ取得エラー:", error);
      }
    }

    setSpreadsheetData(allData);
    setFilteredSpreadsheetData(allData);
    setIsLoading(false);
  };

  // ✅ CSVファイルのアップロード処理
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsedCsvData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // ヘッダー行を除外し、比較対象データを取得
      const formattedCsvData = parsedCsvData.slice(1).map(row => ({
        date: row[0] ? String(row[0]).trim() : "",
        name: row[1] ? String(row[1]).trim() : "",
        price: row[2] ? String(row[2]).trim() : "",
        shipping: row[4] ? String(row[4]).trim() : "",
      })).filter(row => row.date);

      setCsvData(formattedCsvData);
    };
    reader.readAsArrayBuffer(file);
  };

  // ✅ 比較処理（比較ボタンを押したときに実行）
  const compareData = () => {
    // ✅ CSVのフィルター処理（年・月で絞り込み）
    let filteredCsv = csvData;
    if (selectedCsvYear) {
      filteredCsv = filteredCsv.filter(row => row.date.startsWith(selectedCsvYear));
    }
    if (selectedCsvMonth) {
      filteredCsv = filteredCsv.filter(row => new Date(row.date).getMonth() + 1 === parseInt(selectedCsvMonth));
    }
    setFilteredCsvData(filteredCsv);
  
    // ✅ スプレッドシートのフィルター処理（年・月・担当者で絞り込み）
    let filteredSheet = spreadsheetData;
    if (selectedYear) {
      filteredSheet = filteredSheet.filter(row => row.year === selectedYear);
    }
    if (selectedMonth) {
      filteredSheet = filteredSheet.filter(row => row.month === selectedMonth);
    }
    if (selectedOwner) {
      filteredSheet = filteredSheet.filter(row => row.sheetName.includes(selectedOwner));
    }
    setFilteredSpreadsheetData(filteredSheet);
  
    // ✅ データ比較処理
    const sheetKeys = new Set(filteredSheet.map(item => `${item.date}|${item.name}|${item.price}|${item.shipping}`));
    const csvKeys = new Set(filteredCsv.map(item => `${item.date}|${item.name}|${item.price}|${item.shipping}`));
  
    const matched = filteredSheet.filter(item => csvKeys.has(`${item.date}|${item.name}|${item.price}|${item.shipping}`));
    const unmatchedSheet = filteredSheet.filter(item => !csvKeys.has(`${item.date}|${item.name}|${item.price}|${item.shipping}`));
    const unmatchedCsv = filteredCsv.filter(item => !sheetKeys.has(`${item.date}|${item.name}|${item.price}|${item.shipping}`));
  
    setMatchedData(matched);
    setUnmatchedData([...unmatchedSheet, ...unmatchedCsv]);
  };
  

  return (
    <div>
      <h2>比較タブ</h2>

      {/* フィルター UI */}
      <div>
        <label>年: 
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            <option value="">すべて</option>
            {years.map(year => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>

        <label>月: 
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">すべて</option>
            {months.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
        </label>

        <label>担当者: 
          <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)}>
            <option value="">すべて</option>
            {AQ_OPTIONS.map(owner => <option key={owner} value={owner}>{owner}</option>)}
          </select>
        </label>
      </div>

      <button onClick={fetchSpreadsheetData}>スプレッドシートのデータ取得</button>
      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvUpload} />
      <button onClick={compareData}>比較</button>

    </div>
  );
};

export default ComparisonComponent;
