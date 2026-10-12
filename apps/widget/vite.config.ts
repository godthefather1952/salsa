import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiUrl = process.env.SALSA_API_URL ?? 'http://127.0.0.1:3001';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // The widget calls /v1/... on its own origin, as it will in production
    // where salsa serves the widget and the API from one domain.
    proxy: { '/v1': apiUrl },
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: { '/v1': apiUrl },
  },
});
