const express = require('express');
const axios = require('axios');
const app = express();

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const clientSecret = process.env.REACT_APP_GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.REACT_APP_GOOGLE_REDIRECT_URI; // GCPで設定したリダイレクトURI

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    // 認証コードをアクセストークンに交換
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

    const { access_token, refresh_token } = response.data;
    console.log('アクセストークン:', access_token);
    console.log('リフレッシュトークン:', refresh_token);

    // アクセストークンをクライアントに返す（仮のページとして表示）
    res.send(`アクセストークン: ${access_token}`);
  } catch (error) {
    console.error('アクセストークンの取得に失敗しました:', error);
    res.status(500).send('アクセストークンの取得に失敗しました');
  }
});

app.listen(3001, () => {
  console.log('サーバーがポート3001で起動しました');
});
