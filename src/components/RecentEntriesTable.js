const RecentEntriesTable = ({ recentEntries, handleEdit, handleDeleteRow, isProcessing }) => (
  <table>
    <thead>
      <tr>
        <th>編集</th>
        <th>削除</th>
        <th>出品名</th>
        <th>在庫数</th>
        <th>発送代行ID</th>
        <th>発送日</th>
        <th>お届け先氏名</th>
      </tr>
    </thead>

　　　
    <tbody>
      {recentEntries.map((entry, index) => (
        <tr key={index}>
          <td>
            <button onClick={() => handleEdit(entry)} disabled={isProcessing}>
              編集
            </button>
          </td>
          <td>
            <button onClick={() => handleDeleteRow(entry.index)} disabled={isProcessing}>
              削除
            </button>
          </td>
          <td>{entry.kColumn}</td>
          <td>{entry.akColumn}</td>
          <td>{entry.alColumn}</td>
          <td>{entry.amColumn}</td>
          <td>{entry.sColumn}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default RecentEntriesTable;
