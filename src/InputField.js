const InputField = ({ inputValue, setInputValue, handleInput, isProcessing }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="出品名を入力"
    />
    <button onClick={handleInput} disabled={isProcessing}>
      入力
    </button>
  </div>
);

export default InputField;
