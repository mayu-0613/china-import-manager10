import axios from 'axios';

export const AP_OPTIONS = ["矢崎", "奥村", "森栄", "新野", "冨永", "千田", "阿部", "石橋", "塚原"];

export const AA_OPTIONS = ["", "Shops","Yahoo"];

export const initializeInputs = () => ({
  D: '',
  N: '',
  S: '',
  Y: '',
  X: '',
  W: '',
  T: '',	
  U: '',
  AP: '',
  AA: '',
});

export const getSheetIds = () => ({
  '130未来物販': process.env.REACT_APP_SPREADSHEET_ID_130,
  '20なちさん': process.env.REACT_APP_SPREADSHEET_ID_20,
  '76岩木さん': process.env.REACT_APP_SPREADSHEET_ID_76,
  '190黒田さん': process.env.REACT_APP_SPREADSHEET_ID_190,
});

export const getPlaceholders = () => ({
  D: '注文日を入力してください',
  N: '価格を入力してください',
  S: 'お届け先氏名を入力してください',
  Y: 'お届け先郵便番号を入力してください',
  X: 'お届け先都道府県を入力してください',
  W: 'お届け先市区町村を入力してください',
  T: 'お届け先住所1を入力してください',
  U: 'お届け先住所2を入力してください',
  AP: '担当者名を選択してください',
  AA: '空白 or Shopsを選択してください',
});

export const fetchSheetData = async (selectedSheet, sheetName, range) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
  const response = await axios.get(url);
  return response.data.values || [];
};

export const processRecentEntries = (rows, alData, amData, akData) =>
  rows.slice(-5).reverse().map((row, index) => ({
    index: rows.length - index,
    kColumn: row[0] || '',
    sColumn: row[8] || '',
    alColumn: alData[rows.length - index - 1]?.[0] || '',
    amColumn: amData[rows.length - index - 1]?.[0] || '',
    akColumn: akData[rows.length - index - 1]?.[0] || '',
  }));

export const appendSheetData = async (selectedSheet, sheetName, column, value, accessToken) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const range = `${sheetName}!${column}:${column}`;
  const response = await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const lastRowIndex = response.data.values?.length + 1 || 1;
  const targetRange = `${sheetName}!${column}${lastRowIndex}`;
  await axios.put(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}?valueInputOption=USER_ENTERED`,
    { values: [[value]] },
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );
  return lastRowIndex;
};

export const fetchRowData = async (selectedSheet, sheetName, rowIndex, range) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
  const response = await axios.get(url);
  return response.data.values?.[rowIndex - 1] || [];
};

export const updateBatchData = async (selectedSheet, sheetName, rowIndex, data, accessToken) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  for (const [column, value] of Object.entries(data)) {
    const range = `${sheetName}!${column}${rowIndex}`;
    await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      { values: [[value]] },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
  }
};

export const extractEditingData = (entry) => ({
  D: entry.dColumn || '',
  N: entry.nColumn || '',
  S: entry.sColumn || '',
  Y: entry.yColumn || '',
  X: entry.xColumn || '',
  W: entry.wColumn || '',
  T: entry.tColumn || '',
  U: entry.uColumn || '',
  AP: entry.apColumn || '',
  AA: entry.aaColumn || '',
});

export const formatPostalCode = (postalCode) =>
  postalCode.length > 3 ? `${postalCode.slice(0, 3)}-${postalCode.slice(3)}` : postalCode;

export const updateAddressFromPostalCode = async (postalCode, setAdditionalInputs) => {
  if (postalCode.length === 7) {
    const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
    const { address1, address2, address3 } = response.data.results[0];
    setAdditionalInputs((prev) => ({
      ...prev,
      X: address1 || '',
      W: address2 || '',
      T: address3 || '',
    }));
  }
};

