import React, { useEffect } from 'react';
import axios from 'axios';


const AuthComponent = ({ onSignInSuccess }) => {
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID; // Google Cloud Platformで取得したクライアントID
  const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;// Google Cloud Platformで取得したクライアントシークレット
  const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI; // GCPで設定したリダイレクトURI
  const scope = 'https://www.googleapis.com/auth/spreadsheets';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${encodeURIComponent(scope)}&access_type=offline&include_granted_scopes=true&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${clientId}`;


  const exchangeCodeForToken = async (code) => {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token } = response.data;
      console.log('アクセストークン:', access_token);
      onSignInSuccess(access_token); // サインイン成功を通知して状態を更新
    } catch (error) {
      console.error('アクセストークンの取得に失敗しました:', error);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      exchangeCodeForToken(code);
    }
  }, [exchangeCodeForToken]);


  return (
    <div>
      <h2>Google Sheets 認証</h2>
      <a href={authUrl}>Google アカウントでログイン</a>
    </div>
  );
};

export default AuthComponent;
