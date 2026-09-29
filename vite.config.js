import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

function removeCrossorigin() {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin(=("[^"]*"|'[^']*'|[^\s>]+))?/g, '');
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), removeCrossorigin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
});

