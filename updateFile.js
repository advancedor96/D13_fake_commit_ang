const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/core');

router.post('/updateFile', async (req, res) => {
  const { city = '', country = '' } = req.body;
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
    // 取得 README.md 內容與 sha
    let oldContent = '';
    let sha = undefined;
    try {
      const { data: file } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path
      });
      oldContent = Buffer.from(file.content, 'base64').toString('utf-8');
      sha = file.sha;
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({
          error: '權限不足，GitHub Token 失效'
        });
      } else {
        return res.status(error.status || 500).json({
          error: '取得 README.md 內容失敗: ' + (error.message || '未知錯誤')
        });
      }
    }

    // 計算 commit 次數
    // 取得今天日期
    const today = new Date().toISOString().split('T')[0];
    // 新內容為舊內容 + 今天日期 + 換行
    const newContent = oldContent + `${today}(${city}, ${country}),\n`;

    // 更新 README.md
    try {
      await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
        owner,
        repo,
        path,
        message: `Update README.md: ${today}`,
        content: Buffer.from(newContent).toString('base64'),
        sha
      });

      res.json({ message: `README.md updated: ${today}` });
    } catch (error) {
      if (error.status === 401) {
        return res.status(401).json({
          error: '權限不足，GitHub Token 失效'
        });
      } else {
        return res.status(error.status || 500).json({
          error: '更新 README.md 失敗: ' + (error.message || '未知錯誤')
        });
      }
    }
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || '更新 README.md 發生未預期錯誤'
    });
  }
});

module.exports = router;