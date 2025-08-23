require('dotenv').config();  // 移到最上面
const express = require('express');
const path = require('path');

const app = express();
// 在所有路由之前加入這些中間件
app.use(express.json());  // 處理 JSON 格式的請求體
app.use(express.urlencoded({ extended: true }));  // 處理 URL-encoded 格式的請求體

// 添加測試路由來確認 API 是否正常運作
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working',
    env: {
      hasGithubToken: !!process.env.GITHUB_TOKEN,
      hasGithubOwner: !!process.env.GITHUB_REPO_OWNER,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

const getLastCheckin = require('./getLastCheckin');
const updateFile = require('./updateFile');

app.use(express.static(path.join(__dirname, 'frontend/dist/browser')));


app.use('/api', getLastCheckin);
app.use('/api', updateFile);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/browser/index.html'));
});

// 啟動服務器
if (process.env.VERCEL) {
  console.log('Running on Vercel...');
  module.exports = app;
} else {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}