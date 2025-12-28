import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Base path configuration for different deployment targets:
  // - Railway: '/' (root path)
  // - GitHub Pages: '/prompt-gen-web/' (repository name)
  // - Local development: '/' (root path)
  // Use RAILWAY_ENVIRONMENT to detect Railway, or VITE_BASE_PATH to override
  base:
    process.env.VITE_BASE_PATH ||
    (process.env.RAILWAY_ENVIRONMENT
      ? '/'
      : process.env.NODE_ENV === 'production'
        ? '/prompt-gen-web/'
        : '/'),
});
