const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/core');

router.get('/getLastCheckin', async (req, res) => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_REPO_OWNER;
  const repo = 'udemy_1007';
  const path = 'README.md';

  if (!token || !owner) {
    return res.status(400).json({
      error: '缺少必要參數(token或owner)'
    });
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data: file } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner,
      repo,
      path
    });

    const content = Buffer.from(file.content, 'base64').toString('utf-8');
    const lines = content.trim().split('\n').filter(line => line);
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';
    const lastDate = lastLine.split('(')[0].replace(',', '').trim();
    
    res.json({ lastDate, lastLine });
  } catch (error) {
    if (error.status === 401) {
      return res.status(401).json({
        error: 'GitHub Token 失效或權限不足'
      });
    } else if (error.status === 404) {
      return res.json({ lastDate: '', lastLine: '' });
    }
    
    res.status(error.status || 500).json({
      error: '取得 README.md 內容失敗: ' + (error.message || '未知錯誤')
    });
  }
});

module.exports = router;