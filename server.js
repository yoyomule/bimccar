const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();

// 使用 mkcert 生成的证书
const options = {
    key: fs.readFileSync(path.join(__dirname, 'cert', 'cert.key')),
    cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.crt'))
};

// 静态文件服务
app.use(express.static('./'));

// 启动服务器
https.createServer(options, app).listen(3000, () => {
    console.log('HTTPS Server running on port 3000');
}); 