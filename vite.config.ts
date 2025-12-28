import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig(() => {
  const envBase = process.env.VITE_BASE_PATH;
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
  const isProd = process.env.NODE_ENV === 'production';

  // Priority:
  // 1) Explicit VITE_BASE_PATH (best for CI/CD)
  // 2) Railway detected
  // 3) Production (GitHub Pages subpath)
  // 4) Default
  const base = envBase || (isRailway ? '/' : isProd ? '/prompt-gen-web/' : '/');

  return {
    plugins: [vue()],
    base,
  };
});
