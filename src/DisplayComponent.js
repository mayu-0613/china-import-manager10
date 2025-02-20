import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSheetIds, AQ_OPTIONS } from "./utils"; // ✅ 担当者の選択肢をインポート

const DisplayComponent = ({ accessToken }) => {
  const sheetName = "売上管理表";
  const [sheets] = useState(["130未来物販", "20なちさん", "76岩木さん", "190黒田さん"]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [months] = useState(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedUser, setSelectedUser] = useState(""); // ✅ 初期値は「全て」
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [csvData, setCsvData] = useState([]); // ✅ CSVデータ保存
  const [comparisonColumn, setComparisonColumn] = useState(""); // ✅ 比較する列
  const [isComparing, setIsComparing] = useState(false); // ✅ 比較中の状態管理


  useEffect(() => {
    setYears(Array.from({ length: 6 }, (_, i) => (2020 + i).toString()));
  }, []);


  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const text = target.result;
      const rows = text.split("\n").map(row => row.split(","));
  
      const formattedCsvData = rows.map(row => {
        if (row.length < 2) return null; // データ不足なら無視
  
        const originalDate = row[0]?.trim();
        const productName = row[1]?.trim();
  
        let formattedDate = "";
        if (originalDate) {
          const dateParts = originalDate.split(" ")[0].split("/");
          if (dateParts.length === 3) {
            const [year, month, day] = dateParts;
            formattedDate = `${year}/${month.padStart(2, "0")}/${day.padStart(2, "0")}`;
          }
        }
  
        return { formattedDate, productName };
      }).filter(row => row); // nullを除外
  
      setCsvData(formattedCsvData);
    };
  
    reader.readAsText(file);
  };
  
  const compareData = () => {
    if (csvData.length === 0) {
      console.warn("⚠ CSVデータが空です！");
      return;
    }
  
    setIsComparing(true); // ✅ 比較開始
  
    setTimeout(() => {
      console.log("📌 CSVデータ:", csvData);
      console.log("📌 現在のスプレッドシートデータ:", filteredData);
  
      // ✅ CSVデータから商品名リストを作成
      const csvProductNames = new Set(csvData.map(csvRow => csvRow.productName.trim()));
      console.log("📌 CSVの商品名リスト:", csvProductNames);
  
      // ✅ スプレッドシートのデータと比較
      const comparedData = filteredData.map(row => {
        const isMatched = csvProductNames.has(row.productName.trim());
        console.log(`🔍 比較: "${row.productName}" → ${isMatched ? "✅ 一致" : "❌ 不一致"}`);
  
        return { ...row, match: isMatched };
      });
  
      setFilteredData(comparedData); // ✅ 更新後のデータをセット
      setIsComparing(false); // ✅ 比較完了
  
      console.log("📌 更新後の比較結果:", comparedData);
    }, 500);
  };
  
  


  const fetchBatchData = async (spreadsheetId) => {
    if (!spreadsheetId) {
      console.error("fetchBatchData: スプレッドシートIDが null です");
      return Array(13).fill([]);
    }

    try {
      const columns = ["AR", "AS", "AQ", "AL", "CH", "AA", "D", "K", "S", "Y", "X", "W", "T", "U"];
      const ranges = columns.map(col => `'${sheetName}'!${col}3:${col}`).join("&ranges=");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

      const response = await axios.get(url);
      return response.data.valueRanges.map(range => range.values || []);
    } catch (error) {
      console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
      return Array(13).fill([]);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const sheetIds = getSheetIds();
    console.log("取得したスプレッドシートID:", sheetIds); // ✅ デバッグ
    let allData = [];

    try {
      for (const [sheetKey, spreadsheetId] of Object.entries(sheetIds)) {
      // ✅ 「全て」の場合はすべてのシートを取得する
      if (selectedSheet && selectedSheet !== "全て" && selectedSheet !== sheetKey) {
        continue;
      }

      if (!spreadsheetId) {
        console.error(`スプレッドシートIDが取得できませんでした: ${sheetKey}`);
        continue; // ✅ 無効なIDをスキップ
      }
        const fetchedData = await fetchBatchData(spreadsheetId);
        const [dataAR, dataAS, dataAQ, dataAL, dataCH, dataAA, dataD, dataK, dataS, dataY, dataX, dataW, dataT, dataU] = fetchedData;

        const formattedData = dataD.map((row, index) => {
          const orderDate = row[0]?.trim() || ""; // yyyy/mm/dd
          const orderYear = orderDate.split("/")[0] || "";
          const orderMonth = orderDate.split("/")[1] || "";

          return {
            id: `${spreadsheetId}-${index + 3}`,
            spreadsheetId,
            rowIndex: index + 3,
            extraField1: dataAR[index]?.[0] === "TRUE",
            extraField2: dataAS[index]?.[0] === "TRUE",
            Orner: dataAQ[index]?.[0] || "", // 担当者
            deliveryId: dataAL[index]?.[0] || "",
            productNumber: dataCH[index]?.[0] || "",
            shop: dataAA[index]?.[0] || "",
            orderDate,
            orderYear,
            orderMonth,
            productName: dataK[index]?.[0] || "",
            name: dataS[index]?.[0] || "",
            postalCode: dataY[index]?.[0] || "",
            prefecture: dataX[index]?.[0] || "",
            city: dataW[index]?.[0] || "",
            address1: dataT[index]?.[0] || "",
            address2: dataU[index]?.[0] || "",
            match: true, // ✅ 検索のみの場合は全て一致扱い
          };
        }).filter(row => row.orderDate);

        allData = [...allData, ...formattedData];
      }

      // ✅ フィルター処理
      let filtered = allData;
      if (selectedYear) {
        filtered = filtered.filter(row => row.orderYear === selectedYear);
      }
      if (selectedMonth) {
        filtered = filtered.filter(row => row.orderMonth === selectedMonth);
      }
      if (selectedUser) {
        filtered = filtered.filter(row => row.Orner === selectedUser);
      }
      // ✅ プルダウンで選択した日付でフィルタリング
      if (selectedYear && selectedMonth) {
        const selectedDate = `${selectedYear}/${selectedMonth}`;
        filtered = filtered.filter(row => row.orderDate.startsWith(selectedDate));
      }
      
      // ✅ CSVデータとの比較（ボタンを押すまで実行しない）
      if (csvData.length > 0) {
        filtered = filtered.map(row => {
          const isMatched = csvData.some(csvRow => csvRow.productName === row.productName);
          return { ...row, match: isMatched };
        });
      }
      

      filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      setFilteredData(filtered);
    } catch (error) {
      console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div>
      <h2>表示</h2>

      <div>
        <label>スプレッドシート:</label>
        <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
          <option value="">全て</option>
          {sheets.map(sheet => (
            <option key={sheet} value={sheet}>{sheet}</option>
          ))}
        </select>
      </div>

      <div>
        <label>年:</label>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          <option value="">すべて</option>
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div>
        <label>月:</label>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="">すべて</option>
          {months.map((month, index) => (
            <option key={index} value={month}>{month}</option>
          ))}
        </select>
      </div>

      <div>
        <label>担当者:</label>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">全て</option> {/* ✅ 担当者を絞らない場合 */}
          {AQ_OPTIONS.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
      </div>

      <button onClick={fetchData}>検索</button>

      <div>
      <label>CSVアップロード:</label>
        <input type="file" accept=".csv" onChange={handleCsvUpload} />
      </div>

      <button onClick={compareData} disabled={csvData.length === 0 || isComparing}>
       {isComparing ? "比較中..." : "比較"}
      </button>

      {isComparing && <p style={{ color: "blue", fontWeight: "bold" }}>🔍 比較中...</p>}


      {isLoading ? (
        <p>📦 データを読み込み中…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>確認</th>
              <th>発送</th>
              <th>担当者</th>
              <th>発送代行ID</th>
              <th>商品番号</th>
              <th>ショップ</th>
              <th>注文日</th>
              <th>商品名</th>
              <th>氏名</th>
              <th>郵便番号</th>
              <th>都道府県</th>
              <th>市区町村</th>
              <th>住所1</th>
              <th>住所2</th>
            </tr>
          </thead>
          <tbody>
         {filteredData.length > 0 ? (
          filteredData.map(row => (
            <tr key={row.id} style={{ backgroundColor: row.match ? "white" : "pink" }}>
             <td><input type="checkbox" checked={row.extraField1} readOnly /></td>
             <td><input type="checkbox" checked={row.extraField2} readOnly /></td>
              <td>{row.Orner}</td>
             <td>{row.deliveryId}</td>
             <td>{row.productNumber}</td>
             <td>{row.shop}</td>
              <td>{row.orderDate}</td>
              <td>{row.productName}</td>
             <td>{row.name}</td>
             <td>{row.postalCode}</td>
             <td>{row.prefecture}</td>
             <td>{row.city}</td>
              <td>{row.address1}</td>
              <td>{row.address2}</td>
            </tr>
          ))
       ) : (
    <tr><td colSpan="14">データがありません</td></tr>
  )}
</tbody>

        </table>
      )}
    </div>
  );
};

export default DisplayComponent;
