import React from 'react';

const PriceTable = ({ priceData }) => {
  if (priceData.length === 0) {
    return <p>データがありません。</p>;
  }

  const headers = priceData[0]; // ヘッダー（1行目）
  const rows = priceData.slice(1); // データ部分

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
