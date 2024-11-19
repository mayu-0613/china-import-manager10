const EditForm = ({ editingData, setEditingData, placeholders, handleSaveEdit, isProcessing }) => (
  <div>
    <h3>編集フォーム</h3>
    {Object.keys(editingData).map((col) => (
      <div key={col} className="additional-input">
        {col === 'D' ? (
          <input
            type="text"
            name={col}
            value={editingData[col]} // 初期値としてeditingDataを使用
            onChange={(e) => setEditingData({ ...editingData, [col]: e.target.value })}
            placeholder="注文日"
          />
        ) : (
          <input
            type="text"
            name={col}
            value={editingData[col]} // 初期値としてeditingDataを使用
            onChange={(e) => setEditingData({ ...editingData, [col]: e.target.value })}
            placeholder={placeholders[col]}
          />
        )}
      </div>
    ))}
    <button onClick={handleSaveEdit} disabled={isProcessing}>
      保存
    </button>
  </div>
);

export default EditForm;
