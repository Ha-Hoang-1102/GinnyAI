import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'ginny-local-api-origin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/') && req.headers.origin &&
            !['http://127.0.0.1:5173', 'http://localhost:5173'].includes(req.headers.origin)) {
          res.statusCode = 403;
          res.end('Origin không được phép');
          return;
        }
        next();
      });
    },
  }],
  server: {
    host: '127.0.0.1', port: 5173, strictPort: true, cors: false,
    proxy: {'/api': {target: 'http://127.0.0.1:8765', changeOrigin: true,
      headers: {Origin: 'http://127.0.0.1:8765'}}},
  },
  build: {
    outDir: '../ginny/static', emptyOutDir: true,
    rollupOptions: {output: {
      entryFileNames: 'app.js',
      assetFileNames: (asset) => asset.names?.some(name => name.endsWith('.css')) ? 'style.css' : '[name][extname]',
    }},
  },
});
