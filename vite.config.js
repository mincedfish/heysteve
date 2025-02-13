import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/heysteve/', // Replace 'heysteve' with your repository name if it’s different
  server: {
    host: '0.0.0.0',
    port: 3000
  }
});
