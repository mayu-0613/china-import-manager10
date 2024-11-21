import React, { useState } from 'react';
import axios from 'axios';

const SearchComponent = ({ accessToken }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');
  const [statusMessage, setStatusMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sheetIds = {
    '130未来物販': process.env.REACT_APP_SPREADSHEET_ID_130,
    '20なちさん': process.env.REACT_APP_SPREADSHEET_ID_20,
    '76岩木さん': process.env.REACT_APP_SPREADSHEET_ID_76,
    '190黒田さん': process.env.REACT_APP_SPREADSHEET_ID_190,
  };

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

  const handleSearch = async () => {
    setIsProcessing(true);
    setStatusMessage('検索中です...');
    const spreadsheetId = sheetIds[selectedSheet];
    const mainRange = '売上管理表!A2:AP1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${mainRange}?key=${apiKey}`;

    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const rows = response.data.values;

      const filteredRows = await Promise.all(
        rows
          .filter((row) => row.some((cell) => cell.includes(searchTerm)))
          .map(async (row) => {
            const isFoundInMercariSheet = await searchInMercariSheet(row[37], spreadsheetId);
            return [...row, isFoundInMercariSheet ? '〇' : '×'];
          })
      );

      setResults(filteredRows);
      setStatusMessage(filteredRows.length > 0 ? '検索結果が見つかりました！' : '一致する結果が見つかりませんでした。');
    } catch (error) {
      console.error('Error fetching data:', error);
      setStatusMessage('検索に失敗しました。');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const searchInMercariSheet = async (value, spreadsheetId) => {
    const mercariRange = 'メルカリ発送済み!A2:AP1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(mercariRange)}?key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const rows = response.data.values || [];
      return rows.some((row) => row.includes(value));
    } catch (error) {
      console.error('Error searching in Mercari sheet:', error);
      return false;
    }
  };

  return (
    <div className="container">
      {statusMessage && (
        <div style={{
          backgroundColor: '#f0f8ff',
          color: '#333',
          padding: '10px',
          marginBottom: '10px',
          border: '1px solid #007BFF',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {statusMessage}
        </div>
      )}

      <h1>売上管理システム</h1>
      <select
        value={selectedSheet}
        onChange={(e) => setSelectedSheet(e.target.value)}
      >
        {Object.keys(sheetIds).map((sheetName) => (
          <option key={sheetName} value={sheetName}>
            {sheetName}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="検索キーワードを入力"
      />
      <button onClick={handleSearch} disabled={isProcessing}>検索</button>

      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>メルカリ確認</th>
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
              <th>Shos</th>
              <th>現在の在庫数</th>
              <th>発送代行ID</th>
              <th>担当者</th>

            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
                <td>{row[42]}</td>
                <td>{row[38]}</td>
                <td>{row[39]}</td>
                <td>{row[40]}</td>
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
                <td>{row[41]}</td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SearchComponent;

