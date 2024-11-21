const ngrok = require('ngrok');
const port = 5173; // Vite 默认端口

(async function() {
  const url = await ngrok.connect(port);
  console.log('Ngrok tunnel created:', url);
})(); 