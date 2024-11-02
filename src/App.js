import React, { useState } from 'react';
import AuthComponent from './AuthComponent';
import SearchComponent from './SearchComponent';
import InputComponent from './InputComponent';
import CostComponent from './CostComponent';

const App = () => {
  const [isSignedIn, setIsSignedIn] = useState(false); // サインイン状態を管理
  const [accessToken, setAccessToken] = useState(null);
  const [activeTab, setActiveTab] = useState('search');

  // サインイン成功時に呼び出す関数
  const handleSignInSuccess = (token) => {
    setAccessToken(token);
    setIsSignedIn(true);
  };

  return (
    <div className="App">
      <h1>中国輸入 売上管理</h1>

      {/* サインインしているかどうかで表示を切り替え */}
      {!isSignedIn ? (
        <AuthComponent onSignInSuccess={handleSignInSuccess} />
      ) : (
        <div>
          {/* タブの切り替えボタン */}
          <div className="tabs">
            <button
              className={activeTab === 'search' ? 'active' : ''}
              onClick={() => setActiveTab('search')}
            >
              検索
            </button>
            <button
              className={activeTab === 'input' ? 'active' : ''}
              onClick={() => setActiveTab('input')}
            >
              入力
            </button>
            <button
              className={activeTab === 'analysis' ? 'active' : ''}
              onClick={() => setActiveTab('analysis')}
            >
              価格
            </button>
          </div>


          {/* アクティブなタブに応じてコンポーネントを表示 */}
          {activeTab === 'search' && <SearchComponent accessToken={accessToken} />}
          {activeTab === 'input' && <InputComponent accessToken={accessToken} />}
          {activeTab === 'cost' && <CostComponent accessToken={accessToken} />}
        </div>
      )}
    </div>
  );
};

export default App;
