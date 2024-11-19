const SheetSelector = ({ sheetIds, selectedSheet, setSelectedSheet }) => (
  <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
    {Object.keys(sheetIds).map((sheetName) => (
      <option key={sheetName} value={sheetName}>
        {sheetName}
      </option>
    ))}
  </select>
);

export default SheetSelector;
