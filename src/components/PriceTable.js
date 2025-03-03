import React from 'react';

const PriceTable = ({ priceData }) => {
  if (!priceData || priceData.length === 0) {
    return <p>データがありません。</p>;
  }

  const headers = priceData[0]; // 最初の行をヘッダーとして使用
  const rows = priceData.slice(1); // 2行目以降をデータ行として使用

  return (
    <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} style={{ padding: '8px', textAlign: 'left' }}>
              {header || `列${index + 1}`}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={{ padding: '8px' }}>
                {cell || '-'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default PriceTable;
