import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSheetIds } from "./utils"; // スプレッドシートIDを取得するためにインポート

const ShippingRequestComponent = ({ accessToken }) => {
  const sheetName = "売上管理表"; // ✅ シート名
  const [shippingData, setShippingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ 読み込み状態
  const [checkedItems, setCheckedItems] = useState({}); // ✅ チェックされた行を管理
  const [isUpdating, setIsUpdating] = useState(false); // ✅ 反映中の状態管理
  const [updateMessage, setUpdateMessage] = useState(""); // ✅ 反映完了メッセージ

  useEffect(() => {
    const fetchUnshippedData = async () => {
      setIsLoading(true);
      setUpdateMessage("");
      const sheetIds = getSheetIds();
      let allData = [];

      try {
        for (const [sheetKey, spreadsheetId] of Object.entries(sheetIds)) {
          if (!spreadsheetId) continue;

          console.log(`Fetching data from: ${spreadsheetId} - ${sheetName}`);

          // ✅ Google Sheets API のリクエストを1回にまとめる
          const encodedSheetName = encodeURIComponent(sheetName);
          const range = `CE:U`;
          const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}!${range}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

          // ✅ 429エラー対応（リトライ機能）
          const fetchDataWithRetry = async (attempt = 1) => {
            try {
              const response = await axios.get(url);
              return response.data.values || [];
            } catch (error) {
              if (error.response && error.response.status === 429 && attempt < 5) {
                console.warn(`🚨 429エラー発生！${attempt}回目のリトライ...`);
                await new Promise(res => setTimeout(res, 1000 * attempt));
                return fetchDataWithRetry(attempt + 1);
              } else {
                throw error;
              }
            }
          };

          const data = await fetchDataWithRetry();
          // 各列のデータを取得
          const fetchColumn = async (col) => {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!${col}:${col}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
            const response = await axios.get(url);
            return response.data.values || [];
          };

          const [dataCG, dataAL, dataCH, dataAA, dataD, dataK, dataS, dataY, dataX, dataW, dataT, dataU] = await Promise.all([
            fetchColumn("CG"), // 発送済み
            fetchColumn("AL"), // 発送代行ID
            fetchColumn("CH"), // 商品番号
            fetchColumn("AA"), // Shops
            fetchColumn("D"),  // 注文日
            fetchColumn("K"),  // 商品名
            fetchColumn("S"),  // 氏名
            fetchColumn("Y"),  // 郵便番号
            fetchColumn("X"),  // 都道府県
            fetchColumn("W"),  // 市区町村
            fetchColumn("T"),  // 住所1
            fetchColumn("U"),  // 住所2
          ]);

          // ✅ 注文日が空白でない & CG列（発送済み）が空白のデータのみ取得
          const unshippedData = dataD.map((row, index) => {
            const orderDate = row[0]?.trim();
            const cgValue = dataCG[index] ? dataCG[index][0] : "";

            if (orderDate && (!cgValue || cgValue.trim() === "")) {
              return {
                id: `${spreadsheetId}-${index + 1}`, // ✅ ユニークなキー
                spreadsheetId, // ✅ どのスプレッドシートかを記録
                rowIndex: index + 1,
                shipped: cgValue, // ✅ 発送済み（CG列）
                deliveryId: dataAL[index]?.[0] || "",
                productNumber: dataCH[index]?.[0] || "",
                shop: dataAA[index]?.[0] || "",
                orderDate,
                productName: dataK[index]?.[0] || "",
                name: dataS[index]?.[0] || "",
                postalCode: dataY[index]?.[0] || "",
                prefecture: dataX[index]?.[0] || "",
                city: dataW[index]?.[0] || "",
                address1: dataT[index]?.[0] || "",
                address2: dataU[index]?.[0] || "",
              };
            }
            return null;
          }).filter(row => row !== null);

          allData = [...allData, ...unshippedData];
        }

        allData.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        setShippingData(allData);
      } catch (error) {
        console.error(`発送依頼データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnshippedData();
  }, []);

  // ✅ チェックボックスの状態を変更
  const handleCheckboxChange = (id) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleUpdateShipped = async () => {
    if (!window.confirm("本当に反映しますか？")) return;
  
    try {
      const selectedRows = shippingData.filter(row => checkedItems[row.id]);
  
      if (selectedRows.length === 0) {
        alert("発送済みにするデータを選択してください。");
        return;
      }
  
      setIsUpdating(true);
      setUpdateMessage("🔄 反映中です…");
  
      // ✅ スプレッドシートごとにデータをまとめる
      const updatesBySheet = {};
      selectedRows.forEach(row => {
        if (!updatesBySheet[row.spreadsheetId]) {
          updatesBySheet[row.spreadsheetId] = [];
        }
        updatesBySheet[row.spreadsheetId].push(row.rowIndex);
      });
  
      // ✅ 各スプレッドシートごとにバッチ更新
      for (const [spreadsheetId, rowIndexes] of Object.entries(updatesBySheet)) {
        const requests = rowIndexes.map(rowIndex => ({
          range: `'${sheetName}'!CG${rowIndex}`,
          values: [["〇"]],
        }));
  
        const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  
        await axios.post(
          batchUrl,
          { data: requests, valueInputOption: "USER_ENTERED" },
          { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );
      }
  
      // ✅ 反映後に画面を更新
      setShippingData(prevData => prevData.filter(row => !checkedItems[row.id]));
      setCheckedItems({});
      setUpdateMessage("✅ 反映が完了しました！");
    } catch (error) {
      console.error("発送済みの更新に失敗しました", error.response ? error.response.data : error.message);
      setUpdateMessage("❌ 反映に失敗しました。");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getYesterdayDate = () => {
    const today = new Date();
    today.setDate(today.getDate() - 1); // 1日前の日付
    return today.toISOString().split("T")[0]; // "YYYY-MM-DD" 形式で取得
  };
  



  return (
    <div>
      {updateMessage && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: isUpdating ? "orange" : "green",
          color: "white",
          textAlign: "center",
          padding: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          zIndex: 1000
        }}>
          {updateMessage}
        </div>
      )}

      <h2>発送依頼一覧（注文日順）</h2>

      {isLoading ? (
        <p>📦 データを読み込み中…</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>選択</th>
                <th>発送代行ID</th>
                <th>商品番号</th>
                <th>Shops</th>
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
  {shippingData.map((row) => {
    const yesterday = new Date(getYesterdayDate()); // ✅ 昨日の日付（Date オブジェクト）
    const orderDate = new Date(row.orderDate.replace(/\//g, "-")); // ✅ 注文日を Date オブジェクトに変換

    const isPastDue = orderDate < yesterday; // ✅ 前日より前なら true

    return (
      <tr key={row.id}>
        <td>
          <input
            type="checkbox"
            checked={!!checkedItems[row.id]}
            onChange={() => handleCheckboxChange(row.id)}
          />
        </td>
        <td>{row.deliveryId}</td>
        <td>{row.productNumber}</td>
        <td>{row.shop}</td>
        <td
          style={{
            backgroundColor: isPastDue ? "red" : "transparent",
            color: isPastDue ? "white" : "black",
          }}
        >
          {row.orderDate}
        </td>
        <td>{row.productName}</td>
        <td>{row.name}</td>
        <td>{row.postalCode}</td>
        <td>{row.prefecture}</td>
        <td>{row.city}</td>
        <td>{row.address1}</td>
        <td>{row.address2}</td>
      </tr>
    );
  })}
</tbody>

          </table>

          <button onClick={handleUpdateShipped} disabled={isUpdating}>🚀 反映</button>
        </>
      )}
    </div>
  );
};

export default ShippingRequestComponent;
