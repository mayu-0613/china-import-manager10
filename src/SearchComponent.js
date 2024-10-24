import React, { useState } from 'react';
import axios from 'axios';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('130未来物販');

  // スプレッドシートIDのマッピング
  const sheetIds = {
    '130未来物販': '1p44UmyhbrEweW-gNa4Dwc3-KMAAFgP1By4n3_kMC1oo',
    '20なちさん': '1MEnEv2Myp4wXyvFq_WK4dtVZcqmouxtswsKLnFhrmEg',
    '76岩木さん': '1BF4530kjkPKGD-zYku0m1ouRc8mBLQd-rd6zCVU7vOk',
    '190黒田さん': '1LawnuAky6z2WAoNTBYh_HSSfCFxTdzg65ajICrNvFCI',
  };

  // ここにAPIキーを直接書きます
  const apiKey = 'AIzaSyADoacBs6vbxD-4jNEPU50yZIgTA00yTJc'; // 実際のAPIキーに置き換えてください

  const handleSearch = async () => {
    const spreadsheetId = sheetIds[selectedSheet];
    const range = '売上管理表!A2:AP1000';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const rows = response.data.values;

      // 検索条件に一致する行をフィルタリング
      const filteredRows = rows.filter(row => row.some(cell => cell.includes(searchTerm)));
      setResults(filteredRows);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div>
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
      <button onClick={handleSearch}>検索</button>

      {results.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>D列</th>
              <th>K列</th>
              <th>N列</th>
              <th>S列</th>
              <th>Y列</th>
              <th>X列</th>
              <th>W列</th>
              <th>T列</th>
              <th>U列</th>
              <th>AA列</th>
              <th>AK列</th>
              <th>AM列</th>
              <th>AN列</th>
              <th>AO列</th>
              <th>AP列</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={index}>
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
                <td>{row[38]}</td>
                <td>{row[39]}</td>
                <td>{row[40]}</td>
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


