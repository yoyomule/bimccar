import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path';

export default defineConfig({
  plugins: [basicSsl()],
  server: {
    https: true,
    host: true, // 允许局域网访问
  },
  resolve: {
    alias: {
      'three': path.resolve(__dirname, './node_modules/three')
    }
  }
}); 