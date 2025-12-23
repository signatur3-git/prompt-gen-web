import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Base path for GitHub Pages deployment
  // Change '/prompt-gen-web/' to match your repository name
  // Use '/' for root domain or custom domain deployment
  base: process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/',
});
