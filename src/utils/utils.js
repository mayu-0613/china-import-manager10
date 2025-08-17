import axios from 'axios';

// 担当者オプション

export const AQ_OPTIONS = ["矢崎", "奥村", "森栄", "新野", "冨永", "千田", "阿部", "石橋", "塚原","平澤","児島","重松","下島","土井","西山","西田","原田","lily","榊原","上森","山田","りえぷあ","高原","井手","浅野","長田","宮沢","西依","鈴木","根本","山城","古谷","森本","森岡","河住杏","森岡","Amazon","Yahoo"];

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
    // 1. 対象列の最後の行番号を取得
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const lastRowIndex = (response.data.values?.length || 0) + 1;
    const targetRange = `${sheetName}!${column}${lastRowIndex}`;

    // 2. K列にデータ追加
    await axios.put(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${targetRange}?valueInputOption=USER_ENTERED`,
      { values: [[value]] },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ⭐3秒待つ
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. AK:AL列の同じ行を取得
    const akAlRange = `${sheetName}!AK${lastRowIndex}:AL${lastRowIndex}`;
    const akAlResponse = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${akAlRange}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const ak = akAlResponse.data.values?.[0]?.[0] ?? '';
    const al = akAlResponse.data.values?.[0]?.[1] ?? '';

    // 4. まとめて返す
    return {
      rowIndex: lastRowIndex,
      ak,
      al,
    };
  } catch (error) {
    console.error('データ追加または取得エラー:', error);
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


// 📌 スプレッドシートの全データを取得
export const fetchAllEntries = async (selectedSheet) => {
  try {
    const rows = await fetchSheetData(selectedSheet, '売上管理表', 'K3:S');
    const alData = await fetchSheetData(selectedSheet, '売上管理表', 'AL3:AL');
    const amData = await fetchSheetData(selectedSheet, '売上管理表', 'AM3:AM');
    const akData = await fetchSheetData(selectedSheet, '売上管理表', 'AK3:AK');
    const dapData = await fetchSheetData(selectedSheet, '売上管理表', 'D3:AQ');

    const processedEntries = rows.map((row, index) => ({
      index: index + 3, // 3 から始める
      dColumn: dapData[index]?.[0] || '', // ✅ D列（注文日）
      kColumn: row[0] || '',
      sColumn: row[8] || '',
      alColumn: alData[index]?.[0] || '',
      amColumn: amData[index]?.[0] || '',
      akColumn: akData[index]?.[0] || '',
      dColumn: dapData[index]?.[0] || '',
      nColumn: dapData[index]?.[10] || '',
      yColumn: dapData[index]?.[21] || '',
      xColumn: dapData[index]?.[20] || '',
      wColumn: dapData[index]?.[19] || '',
      tColumn: dapData[index]?.[16] || '',
      uColumn: dapData[index]?.[17] || '',
      aqColumn: dapData[index]?.[39] || '',
      aaColumn: dapData[index]?.[23] || '',
    }));
    // ✅ D列（注文日）を新しい順に並び替える
    processedEntries.sort((a, b) => {
      const dateA = new Date(a.dColumn);
      const dateB = new Date(b.dColumn);
      return dateB - dateA; // 新しい日付が上に来るようにソート
    });

    return processedEntries;
  } catch (error) {
    console.error('スプレッドシート取得エラー:', error);
    throw new Error('データ取得に失敗しました。');
  }
};

// 📌 入力バリデーションをチェック
export const validateInputFields = (inputs) => {
  const { D, N, S, T, U, W, X, Y, AQ } = inputs;
  if (S === 'らくらくメルカリ便' || S === 'ゆうパケットポスト') {
    if (!D || !N || !S || !AQ) {
      return '必須項目が入力されていません。';
    }
  } else {
    if (!D || !N || !S || !T || !W || !X || !Y || !AQ) {
      return '必須項目が入力されていません。';
    }
  }
  return null;
};

// 📌 識別番号で該当する行を探す
export const findMatchingRow = async (selectedSheet, identifierValue) => {
  try {
    const response = await fetchSheetData(selectedSheet, '入庫管理表', 'X:Y');
    const rows = response || [];
    const matchedRow = rows.find((row) => row[0] === identifierValue);

    return matchedRow ? matchedRow[1] || '' : ''; // V列の値を返す
  } catch (error) {
    console.error('識別番号検索エラー:', error);
    return '';
  }
};

// 📌 配送タイプ設定
export const setDeliveryType = (type, setAdditionalInputs, setDisableFields) => {
  setAdditionalInputs((prev) => ({ ...prev, S: type }));
  setDisableFields(['T', 'U', 'W', 'X', 'Y']); // 無効化対象
};

// 📌 フィールドの有効化
export const enableFields = (setDisableFields) => {
  setDisableFields([]);
};


