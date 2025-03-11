import axios from 'axios';

// 担当者オプション
export const AQ_OPTIONS = ["矢崎", "奥村", "森栄", "新野", "冨永", "千田", "阿部", "石橋", "塚原", "林","谷口","植津","平澤","南條","児島","重松","下島","土井","小椋","幸野","西山","西田","原田"];

// 販売チャネルオプション
export const AA_OPTIONS = ["", "Shops", "yahoo", "ラクマ", "ヤフオク", "Amazon","Qoo10"];

// 入力フォームの初期値
export const initializeInputs = () => ({
  D: '',
  N: '',
  S: '',
  Y: '',
  X: '',
  W: '',
  T: '',
  U: '',
  AQ: '',
  AA: '',
});

export const getSheetIds = () => ({
  '130未来物販': process.env.REACT_APP_SPREADSHEET_ID_130,
  '20なちさん': process.env.REACT_APP_SPREADSHEET_ID_20,
  '76岩木さん': process.env.REACT_APP_SPREADSHEET_ID_76,
  '190黒田さん': process.env.REACT_APP_SPREADSHEET_ID_190,
});


// 入力フィールドのプレースホルダー設定
export const getPlaceholders = () => ({
  D: '注文日を入力してください',
  N: '価格を入力してください',
  S: 'お届け先氏名を入力してください',
  Y: 'お届け先郵便番号を入力してください',
  X: 'お届け先都道府県を入力してください',
  W: 'お届け先市区町村を入力してください',
  T: 'お届け先住所1を入力してください',
  U: 'お届け先住所2を入力してください',
  AQ: '担当者名を選択してください',
  AA: '空白 or Shopsを選択してください',
});

// Google Sheets API からデータを取得
export const fetchSheetData = async (selectedSheet, sheetName, range) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;
  
  try {
    const response = await axios.get(url);
    console.log(`データ取得成功: ${sheetName}`, response.data.values);
    return response.data.values || [];
  } catch (error) {
    console.error(`Google Sheets APIエラー (${sheetName}, ${range}):`, error);
    throw new Error('データ取得に失敗しました。');
  }
};

// 最近のエントリを処理する（例: 最新5件）
export const processRecentEntries = (rows, alData, amData, akData) =>
  rows.slice(-5).reverse().map((row, index) => ({
    index: rows.length - index,
    kColumn: row[0] || '',
    sColumn: row[8] || '',
    alColumn: alData[rows.length - index - 1]?.[0] || '',
    amColumn: amData[rows.length - index - 1]?.[0] || '',
    akColumn: akData[rows.length - index - 1]?.[0] || '',
  }));

// 新しいデータをスプレッドシートに追加
export const appendSheetData = async (selectedSheet, sheetName, column, value, accessToken) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const range = `${sheetName}!${column}:${column}`;

  try {
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
  } catch (error) {
    console.error('データ追加エラー:', error);
    throw new Error('データの追加に失敗しました。');
  }
};

// 指定行のデータを取得
export const fetchRowData = async (selectedSheet, sheetName, rowIndex, range) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!${range}?key=${process.env.REACT_APP_GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    return response.data.values?.[rowIndex - 1] || [];
  } catch (error) {
    console.error(`行データ取得エラー (${rowIndex}):`, error);
    throw new Error('行データの取得に失敗しました。');
  }
};

// 一括データ更新
export const updateBatchData = async (selectedSheet, sheetName, rowIndex, data, accessToken) => {
  const spreadsheetId = getSheetIds()[selectedSheet];

  try {
    for (const [column, value] of Object.entries(data)) {
      const range = `${sheetName}!${column}${rowIndex}`;
      await axios.put(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        { values: [[value]] },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('一括更新エラー:', error);
    throw new Error('データの更新に失敗しました。');
  }
};

// 編集データを抽出
export const extractEditingData = (entry) => ({
  D: entry.dColumn || '',
  N: entry.nColumn || '',
  S: entry.sColumn || '',
  Y: entry.yColumn || '',
  X: entry.xColumn || '',
  W: entry.wColumn || '',
  T: entry.tColumn || '',
  U: entry.uColumn || '',
  AQ: entry.aqColumn || '',
  AA: entry.aaColumn || '',
});

// 郵便番号フォーマット
export const formatPostalCode = (postalCode) =>
  postalCode.length > 3 ? `${postalCode.slice(0, 3)}-${postalCode.slice(3)}` : postalCode;

// 郵便番号から住所を更新
export const updateAddressFromPostalCode = async (postalCode, setAdditionalInputs) => {
  if (postalCode.length === 7) {
    try {
      const response = await axios.get(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`);
      const { address1, address2, address3 } = response.data.results[0];
      setAdditionalInputs((prev) => ({
        ...prev,
        X: address1 || '',
        W: address2 || '',
        T: address3 || '',
      }));
    } catch (error) {
      console.error('住所取得エラー:', error);
      throw new Error('住所データの取得に失敗しました。');
    }
  }
};


export const markAsShipped = async (selectedSheet, sheetName, rowIndex, accessToken) => {
  const spreadsheetId = getSheetIds()[selectedSheet];
  const column = 'CE'; // CE列を指定
  const value = '発送済み';

  try {
    const range = `${sheetName}!${column}${rowIndex}`;
    await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      { values: [[value]] },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    return true;
  } catch (error) {
    console.error(`発送済み更新エラー (${rowIndex}):`, error);
    throw new Error('発送済みの更新に失敗しました。');
  }
};
