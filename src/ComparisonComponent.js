import React, { useEffect, useState,useRef } from "react";
import axios from "axios";
import { getSheetIds } from "./utils"; 
import { AQ_OPTIONS } from "./utils"; // ✅ 担当者リストをインポート




const sheetName = "売上管理表";
const columns = ["D", "K", "N", "BN", "AQ"]; // AQ列（担当者）を含める


const ComparisonComponent = ({ accessToken }) => {
  const [spreadsheetData, setSpreadsheetData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); 
  const [csvData, setCsvData] = useState([]);
  const [matchedData, setMatchedData] = useState([]);
  const [unmatchedData, setUnmatchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState(""); // ✅ 追加
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const firstRenderRef = useRef(true);
  

  useEffect(() => {
    const fetchBatchData = async (spreadsheetId) => {
      try {
        const ranges = columns.map(col => `'${sheetName}'!${col}3:${col}`).join("&ranges=");
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

        const response = await axios.get(url);
        return response.data.valueRanges.map(range => range.values || []);
      } catch (error) {
        console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
        return Array(columns.length).fill([]);
      }
    };
    
    const fetchData = async () => {
      setIsLoading(true);
      const sheetIds = getSheetIds();
      let allData = [];

      try {
        for (const [sheetKey, spreadsheetId] of Object.entries(sheetIds)) {
          if (!spreadsheetId) continue;

          const fetchedData = await fetchBatchData(spreadsheetId);
          const [dataD, dataK, dataN, dataBN, dataAQ] = fetchedData;

          const formattedData = dataD.map((row, index) => ({
            orderDate: row[0]?.trim() || "",
            productName: dataK[index]?.[0] || "",
            price: Number(dataN[index]?.[0]?.replace("¥", "") || 0),
            shippingFee: Number(dataBN[index]?.[0]?.replace("¥", "") || 0),
            owner: dataAQ[index]?.[0] || "",
            spreadsheetName: sheetKey,
          })).filter(row => row.orderDate);

          allData = [...allData, ...formattedData];
        }

        setSpreadsheetData(allData);
        setFilteredData(allData); // ✅ データ取得時点で `filteredData` を初期化
      } catch (error) {
        console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (spreadsheetData.length === 0) {
        setFilteredData([]);
        setMatchedData([]);
        setUnmatchedData([]);
        return;
    }

    let filtered = spreadsheetData;

    if (selectedSpreadsheet) {
        filtered = filtered.filter(row => row.spreadsheetName === selectedSpreadsheet);
    }
    if (selectedYear) {
        filtered = filtered.filter(row => row.orderDate.startsWith(selectedYear));
    }
    if (selectedMonth) {
        const formattedMonth = selectedMonth.padStart(2, "0");
        filtered = filtered.filter(row => {
            const dateParts = row.orderDate.split("/");
            const month = dateParts.length >= 2 ? dateParts[1].padStart(2, "0") : "";
            return month === formattedMonth;
        });
    }
    if (selectedOwner) {
        filtered = filtered.filter(row => row.owner === selectedOwner);
    }

    console.log("🔍 フィルター適用後のスプレッドシートデータ:", filtered);
    
    setFilteredData(filtered.length > 0 ? filtered : []);
    compareData(filtered, filteredCsvData); // ✅ フィルター適用後に比較実行
}, [spreadsheetData, selectedSpreadsheet, selectedYear, selectedMonth, selectedOwner]);




  
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => (currentYear - 5 + i).toString()); // ✅ 現在の年 - 5 から +1年後まで
  };
  
  const generateMonthOptions = () => {
    return Array.from({ length: 12 }, (_, i) => (i + 1).toString()); // ✅ 1～12月を表示
  };

  // CSVファイルのアップロード処理
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split("\n").map(row => row.split(","));
        let formattedCsvData = rows.slice(1).map(row => ({
            orderDate: row[0]?.trim().split(" ")[0], // ✅ `YYYY/MM/DD h:mm` → `YYYY/MM/DD`
            productName: row[1]?.trim(),
            price: Number(row[2]?.trim() || 0),
            shippingFee: Number(row[4]?.trim() || 0),
        }));

        // ✅ CSVデータから最初のデータを見て、`selectedYear` / `selectedMonth` を自動設定
        if (formattedCsvData.length > 0) {
            const firstDateParts = formattedCsvData[0].orderDate.split("/");
            if (!selectedYear) setSelectedYear(firstDateParts[0]); // 年が未選択なら自動設定
            if (!selectedMonth) setSelectedMonth(firstDateParts[1]); // 月が未選択なら自動設定
        }

        console.log("📂 CSVデータ取得:", formattedCsvData);
        setCsvData(formattedCsvData); // ✅ `csvData` を更新
        setFilteredCsvData(formattedCsvData); // ✅ `filteredCsvData` に即適用

        compareData(formattedCsvData, filteredData); // ✅ CSVアップロード後に比較実行
    };
    reader.readAsText(file);
};


  const [filteredCsvData, setFilteredCsvData] = useState([]);

  useEffect(() => {
    if (csvData.length === 0) return;

    let csvFiltered = csvData.map(row => ({
        ...row,
        orderDate: row.orderDate.split(" ")[0] // ✅ `YYYY/MM/DD h:mm` → `YYYY/MM/DD`
    }));

    if (selectedYear) {
        csvFiltered = csvFiltered.filter(row => row.orderDate.startsWith(selectedYear));
    }
    if (selectedMonth) {
        const formattedMonth = selectedMonth.padStart(2, "0");
        csvFiltered = csvFiltered.filter(row => {
            const dateParts = row.orderDate.split("/");
            const month = dateParts.length >= 2 ? dateParts[1].padStart(2, "0") : "";
            return month === formattedMonth;
        });
    }

    console.log("📂 フィルター適用後の CSV データ:", csvFiltered);
    setFilteredCsvData(csvFiltered);

    compareData(filteredData, csvFiltered); // ✅ フィルター適用後に比較実行
}, [csvData, selectedYear, selectedMonth]);




useEffect(() => {
  if (filteredData.length === 0 || filteredCsvData.length === 0) {
      setMatchedData([]);
      setUnmatchedData([]);
      return;
  }
  compareData();
}, [filteredData, filteredCsvData]);




  // データの比較処理
 const compareData = () => {
    if (filteredData.length === 0 && filteredCsvData.length === 0) return; // ✅ データがない場合は比較しない

    let matched = [];
    let unmatched = [];

    console.log("🔍 最新のフィルター適用後のスプレッドシートデータ:", filteredData);
    console.log("🔍 最新のフィルター適用後の CSV データ:", filteredCsvData);

    // ✅ スプレッドシートのデータをCSVと比較
    filteredData.forEach(sheetRow => {
        const match = filteredCsvData.find(csvRow => {
            const sheetDate = new Date(sheetRow.orderDate);
            const csvDate = new Date(csvRow.orderDate);
            const dateDiff = Math.abs((sheetDate - csvDate) / (1000 * 60 * 60 * 24));

            return (
                dateDiff <= 1 && // ✅ 日付が±1日のズレならOK
                sheetRow.productName === csvRow.productName &&
                sheetRow.price === csvRow.price &&
                sheetRow.shippingFee === csvRow.shippingFee
            );
        });

        if (match) {
            matched.push({ sheet: sheetRow, csv: match });
        } else {
            unmatched.push({ sheet: sheetRow, csv: null });
        }
    });

    // ✅ CSVのデータをスプレッドシートと比較
    filteredCsvData.forEach(csvRow => {
        const existsInSheet = filteredData.some(sheetRow => {
            const sheetDate = new Date(sheetRow.orderDate);
            const csvDate = new Date(csvRow.orderDate);
            const dateDiff = Math.abs((sheetDate - csvDate) / (1000 * 60 * 60 * 24));

            return (
                dateDiff <= 1 &&
                sheetRow.productName === csvRow.productName &&
                sheetRow.price === csvRow.price &&
                sheetRow.shippingFee === csvRow.shippingFee
            );
        });

        if (!existsInSheet) {
            console.log("🚨 スプレッドシートに存在しないCSVデータ:", csvRow);
            unmatched.push({ sheet: null, csv: csvRow });
        }
    });

    setMatchedData(matched);
    setUnmatchedData(unmatched);

    console.log("✅ 一致データ:", matched);
    console.log("❌ 不一致データ:", unmatched);
};


  

  return (
    <div>
      <h2>CSV比較ツール</h2>

      <input type="file" accept=".csv" onChange={handleCsvUpload} />

      {/* フィルター UI */}
      <div>
        <label>スプレッドシート: 
          <select value={selectedSpreadsheet} onChange={(e) => setSelectedSpreadsheet(e.target.value)}>
            <option value="">すべて</option>
            {[...new Set(spreadsheetData.map(item => item.spreadsheetName))].map(sheet => (
              <option key={sheet} value={sheet}>{sheet}</option>
            ))}
          </select>
        </label>

        <label>年: 
         <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {generateYearOptions().map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
         </select>
        </label>

        <label>月: 
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
           {generateMonthOptions().map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
         </select>
        </label>

        <label>担当者: 
         <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)}>
           <option value="">すべて</option>
           {AQ_OPTIONS.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
           ))}
         </select>
        </label>

      </div>



      <h3 style={{ backgroundColor: "lightgreen", padding: "10px", color: "black" }}>
  ✅ 一致データ
</h3>
<table border="1">
<thead>
<tr>
    <th style={{ backgroundColor: "blue", color: "white" }}>スプレッドシート - 売れた日付</th>
    <th style={{ backgroundColor: "blue", color: "white" }}>商品名</th>
    <th style={{ backgroundColor: "blue", color: "hite" }}>価格</th>
    <th style={{ backgroundColor: "blue", color: "white" }}>メルカリ送料</th>
    <th style={{ backgroundColor: "green", color: "white" }}>CSV - 売れた日付</th>
    <th style={{ backgroundColor: "green", color: "white" }}>商品名</th>
    <th style={{ backgroundColor: "green", color: "hite" }}>価格</th>
    <th style={{ backgroundColor: "green", color: "white" }}>メルカリ送料</th>
  </tr>

</thead>
  <tbody>
    {matchedData.map((row, index) => {
      let dateCellStyle = {};
      
      if (!row.sheet || !row.csv) {
        dateCellStyle = { backgroundColor: "red" }; // ❌ 完全に不一致（どちらかが null）
      } else {
        const sheetDate = new Date(row.sheet.orderDate);
        const csvDate = new Date(row.csv.orderDate);
        const dateDiff = Math.abs((sheetDate - csvDate) / (1000 * 60 * 60 * 24)); // ✅ 日付のズレを計算

        if (dateDiff === 0) {
          dateCellStyle = { backgroundColor: "white" }; // ✅ 完全一致
        } else if (dateDiff === 1) {
          dateCellStyle = { backgroundColor: "yellow" }; // ✅ ±1日ズレ
        } else {
          dateCellStyle = { backgroundColor: "red" }; // ❌ それ以外（不一致）
        }
      }

      return (
        <tr key={index}>
          <td style={dateCellStyle}>{row.sheet ? row.sheet.orderDate : "-"}</td>
          <td>{row.sheet ? row.sheet.productName : "-"}</td>
          <td>{row.sheet ? row.sheet.price : "-"}</td>
          <td>{row.sheet ? row.sheet.shippingFee : "-"}</td>
          <td style={dateCellStyle}>{row.csv ? row.csv.orderDate : "-"}</td>
          <td>{row.csv ? row.csv.productName : "-"}</td>
          <td>{row.csv ? row.csv.price : "-"}</td>
          <td>{row.csv ? row.csv.shippingFee : "-"}</td>
        </tr>
      );
    })}
  </tbody>
</table>


<h3 style={{ backgroundColor: "red", padding: "10px", color: "white" }}>
  ❌ 不一致データ
</h3>
    <table border="1">
    <thead>
  <tr>
    <th style={{ backgroundColor: "blue", color: "white" }}>スプレッドシート - 売れた日付</th>
    <th style={{ backgroundColor: "blue", color: "white" }}>商品名</th>
    <th style={{ backgroundColor: "blue", color: "hite" }}>価格</th>
    <th style={{ backgroundColor: "blue", color: "white" }}>メルカリ送料</th>
    <th style={{ backgroundColor: "green", color: "white" }}>CSV - 売れた日付</th>
    <th style={{ backgroundColor: "green", color: "white" }}>商品名</th>
    <th style={{ backgroundColor: "green", color: "hite" }}>価格</th>
    <th style={{ backgroundColor: "green", color: "white" }}>メルカリ送料</th>
  </tr>
     </thead>
     <tbody>
        {unmatchedData.map((row, index) => (
         <tr key={index}>
         <td>{row.sheet ? row.sheet.orderDate : "-"}</td>
         <td>{row.sheet ? row.sheet.productName : "-"}</td>
         <td>{row.sheet ? row.sheet.price : "-"}</td>
         <td>{row.sheet ? row.sheet.shippingFee : "-"}</td>
          <td>{row.csv ? row.csv.orderDate : "-"}</td>
         <td>{row.csv ? row.csv.productName : "-"}</td>
         <td>{row.csv ? row.csv.price : "-"}</td>
         <td>{row.csv ? row.csv.shippingFee : "-"}</td>
         </tr>
       ))}
     </tbody>
</table>

    </div>
  );
};

export default ComparisonComponent;
