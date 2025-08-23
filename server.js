require('dotenv').config();  // 移到最上面
const express = require('express');
const path = require('path');

const app = express();
// 在所有路由之前加入這些中間件
app.use(express.json());  // 處理 JSON 格式的請求體
app.use(express.urlencoded({ extended: true }));  // 處理 URL-encoded 格式的請求體


// 導入路由模組
const getLastCheckin = require('./getLastCheckin');
const updateFile = require('./updateFile');

// 提供 Angular 靜態文件
app.use(express.static(path.join(__dirname, 'frontend/dist/browser')));

// API 路由
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from API 1!' });
});

app.use('/api', getLastCheckin);
app.use('/api', updateFile);

// 其他路由轉到 Angular 的 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/browser/index.html'));
});

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});