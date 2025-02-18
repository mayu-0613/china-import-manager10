import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSheetIds } from "./utils"; // スプレッドシートIDを取得するためにインポート

const ShippingRequestComponent = ({ accessToken }) => {
  const sheetName = "売上管理表"; // ✅ シート名
  const [shippingData, setShippingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // ✅ 読み込み状態
  const [updateMessage, setUpdateMessage] = useState(""); // ✅ 反映完了メッセージ

  const fetchBatchData = async (spreadsheetId) => {
    try {
      const columns = ["AR", "AS", "AQ","AL", "CH", "AA", "D", "K", "S", "Y", "X", "W", "T", "U"];
      const ranges = columns.map(col => `'${sheetName}'!${col}3:${col}`).join("&ranges=");
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${ranges}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
      
      const response = await axios.get(url);
      return response.data.valueRanges.map(range => range.values || []);
    } catch (error) {
      console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
      return Array(13).fill([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setUpdateMessage("");
      const sheetIds = getSheetIds();
      let allData = [];

      try {
        for (const [sheetKey, spreadsheetId] of Object.entries(sheetIds)) {
          if (!spreadsheetId) continue;

          console.log(`Fetching data from: ${spreadsheetId} - ${sheetName}`);
          const fetchedData = await fetchBatchData(spreadsheetId);
          
          const [dataAR, dataAS,dataAQ, dataAL, dataCH, dataAA, dataD, dataK, dataS, dataY, dataX, dataW, dataT, dataU] = fetchedData;

          // ✅ データの整形
          const formattedData = dataD.map((row, index) => {
            return {
              id: `${spreadsheetId}-${index + 3}`,
              spreadsheetId,
              rowIndex: index + 3,
              extraField1: dataAR[index]?.[0] === "TRUE",
              extraField2: dataAS[index]?.[0] === "TRUE",
              Orner: dataAQ[index]?.[0] || "",
              deliveryId: dataAL[index]?.[0] || "",
              productNumber: dataCH[index]?.[0] || "",
              shop: dataAA[index]?.[0] || "",
              orderDate: row[0]?.trim() || "",
              productName: dataK[index]?.[0] || "",
              name: dataS[index]?.[0] || "",
              postalCode: dataY[index]?.[0] || "",
              prefecture: dataX[index]?.[0] || "",
              city: dataW[index]?.[0] || "",
              address1: dataT[index]?.[0] || "",
              address2: dataU[index]?.[0] || "",
            };
          }).filter(row => row.orderDate);

          allData = [...allData, ...formattedData];
        }

        // ✅ 日付を新しい順に並び替え
        allData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        setShippingData(allData);
      } catch (error) {
        console.error(`データ取得エラー (${sheetName}):`, error.response ? error.response.data : error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {updateMessage && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "green",
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
        <table>
          <thead>
            <tr>
              <th>確認</th>
              <th>発送</th>
              <th>担当者</th>
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
            {shippingData.map((row) => (
              <tr key={row.id}>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ShippingRequestComponent;
