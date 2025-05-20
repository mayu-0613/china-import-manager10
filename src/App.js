import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import AuthComponent from "./components/AuthComponent";
import SearchComponent from "./components/SearchComponent";
import InputComponent from "./components/InputComponent";
import ComparisonComponent from "./components/ComparisonComponent";
import ShippingRequestComponent from "./components/ShippingRequestComponent";

const AppContent = ({ accessToken }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="App">
      <h1>中国輸入 売上管理</h1>

      <nav className="tabs">
        <Link to="/search">
          <button className={currentPath === "/search" ? "active" : ""}>検索</button>
        </Link>
        <Link to="/input">
          <button className={currentPath === "/input" ? "active" : ""}>入力</button>
        </Link>
        <Link to="/comparison">
          <button className={currentPath === "/comparison" ? "active" : ""}>比較</button>
        </Link>
        <Link to="/shipping">
          <button className={currentPath === "/shipping" ? "active" : ""}>発送依頼</button>
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/search" />} />
        <Route path="/search" element={<SearchComponent accessToken={accessToken} />} />
        <Route path="/input" element={<InputComponent accessToken={accessToken} />} />
        <Route path="/comparison" element={<ComparisonComponent />} />
        <Route path="/shipping" element={<ShippingRequestComponent accessToken={accessToken} />} />
      </Routes>
    </div>
  );
};

const App = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const handleSignInSuccess = (token) => {
    setAccessToken(token);
    setIsSignedIn(true);
  };

  return (
    <BrowserRouter>
      {!isSignedIn ? (
        <div className="App">
          <h1>中国輸入 売上管理</h1>
          <AuthComponent onSignInSuccess={handleSignInSuccess} />
        </div>
      ) : (
        <AppContent accessToken={accessToken} />
      )}
    </BrowserRouter>
  );
};

export default App;
