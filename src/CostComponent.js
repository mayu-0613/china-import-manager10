import React, { useState, useEffect } from 'react';
import { fetchSheetData, getSheetIds } from './utils'; // ユーティリティ関数のインポート
import SheetSelector from './SheetSelector'; // プルダウン用コンポーネント
import PriceTable from './PriceTable'; // テーブル表示用コンポーネント

const CostComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState(null); // 選択されたスプレッドシート
  const [priceData, setPriceData] = useState([]); // 価格データ
  const [isLoading, setIsLoading] = useState(false); // ローディング状態
  const [error, setError] = useState(null); // エラー状態

  useEffect(() => {
    const sheets = getSheetIds();
    console.log('取得したスプレッドシートID一覧:', sheets);
  }, []);

  const fetchPriceData = async () => {
    if (!selectedSheet) {
      console.log('fetchPriceDataが呼び出されたが、スプレッドシートが未選択です。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`スプレッドシート「${selectedSheet}」からデータを取得中...`);
      const data = await fetchSheetData(selectedSheet, '入庫管理表', 'A:AO');
      console.log('取得したデータ:', data);
      setPriceData(data);
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSheet) {
      console.log('選択されたスプレッドシート:', selectedSheet);
      fetchPriceData();
    } else {
      console.log('まだスプレッドシートが選択されていません。');
    }
  }, [selectedSheet]);

  return (
    <div>
      <h2>価格タブ</h2>

      {/* スプレッドシート選択プルダウン */}
      <SheetSelector
        sheetIds={getSheetIds()}
        selectedSheet={selectedSheet}
        setSelectedSheet={(sheet) => {
          console.log('SheetSelectorで選択:', sheet);
          setSelectedSheet(sheet);
        }}
      />

      {/* スプレッドシートが選択されていない場合、メッセージを表示 */}
      {!selectedSheet && <p style={{ color: 'red' }}>スプレッドシートを選択してください。</p>}

      {/* データ表示（スプレッドシートが選択された場合のみ） */}
      {selectedSheet && (
        <>
          {isLoading && <p>データを読み込んでいます...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {!isLoading && !error && <PriceTable priceData={priceData} />}
        </>
      )}
    </div>
  );
};

export default CostComponent;
