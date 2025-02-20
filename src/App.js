import React, { useState } from 'react';
import AuthComponent from './AuthComponent';
import SearchComponent from './SearchComponent';
import InputComponent from './InputComponent';
import ComparisonComponent from './ComparisonComponent'; // ✅ 表示タブを比較タブに変更
import ShippingRequestComponent from './ShippingRequestComponent'; 

const App = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [activeTab, setActiveTab] = useState('search');

  const handleSignInSuccess = (token) => {
    setAccessToken(token);
    setIsSignedIn(true);
  };

  return (
    <div className="App">
      <h1>中国輸入 売上管理</h1>

      {!isSignedIn ? (
        <AuthComponent onSignInSuccess={handleSignInSuccess} />
      ) : (
        <div>
          {/* タブの切り替えボタン */}
          <div className="tabs">
            <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>
              検索
            </button>
            <button className={activeTab === 'input' ? 'active' : ''} onClick={() => setActiveTab('input')}>
              入力
            </button>
            <button className={activeTab === 'comparison' ? 'active' : ''} onClick={() => setActiveTab('comparison')}>
              比較
            </button>
            <button className={activeTab === 'shipping' ? 'active' : ''} onClick={() => setActiveTab('shipping')}>
              発送依頼
            </button>
          </div>

          {/* アクティブなタブに応じてコンポーネントを表示 */}
          {activeTab === 'search' && <SearchComponent accessToken={accessToken} />}
          {activeTab === 'input' && <InputComponent accessToken={accessToken} />}
          {activeTab === 'comparison' && <ComparisonComponent />} {/* ✅ 比較タブを追加 */}
          {activeTab === 'shipping' && <ShippingRequestComponent accessToken={accessToken} />}
        </div>
      )}
    </div>
  );
};

export default App;
