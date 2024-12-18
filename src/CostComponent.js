import React, { useState, useEffect } from 'react';
import { fetchSheetData, getSheetIds } from './utils';
import SheetSelector from './SheetSelector';
import PriceTable from './PriceTable';

const CostComponent = ({ accessToken }) => {
  const [selectedSheet, setSelectedSheet] = useState(null); // 選択したスプレッドシート
  const [priceData, setPriceData] = useState([]); // 価格データ
  const [isLoading, setIsLoading] = useState(false); // ローディング状態
  const [error, setError] = useState(null); // エラー状態

  // データ取得
  const fetchPriceData = async () => {
    if (!selectedSheet) return; // スプレッドシートが選択されていない場合は何もしない
    setIsLoading(true);
    setError(null);

    try {
      console.log('価格データを取得中...');
      const data = await fetchSheetData(selectedSheet, '入庫管理表', 'A:Z'); // 入庫管理表の全データ取得
      setPriceData(data);
    } catch (err) {
      console.error('価格データの取得に失敗しました:', err);
      setError('価格データの取得に失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  // 選択したスプレッドシートが変更されたときにデータを取得
  useEffect(() => {
    fetchPriceData();
  }, [selectedSheet]);

  return (
    <div>
      <h2>価格タブ</h2>

      {/* スプレッドシート選択プルダウン */}
      <SheetSelector
        sheetIds={getSheetIds()} // スプレッドシートのリスト
        selectedSheet={selectedSheet}
        setSelectedSheet={setSelectedSheet}
      />

      {/* データの表示 */}
      {isLoading && <p>データを読み込んでいます...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!isLoading && !error && selectedSheet && (
        <PriceTable priceData={priceData} /> 
      )}

      {!selectedSheet && <p style={{ color: 'red' }}>スプレッドシートを選択してください。</p>}
    </div>
  );
};

export default CostComponent;
