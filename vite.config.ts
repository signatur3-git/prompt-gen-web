import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import checker from 'vite-plugin-checker'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // Type check in development mode
    checker({
      typescript: true,
      vueTsc: true,
      eslint: {
        lintCommand: 'eslint . --max-warnings 0',
      },
    }),
  ],
  // Base path for GitHub Pages deployment
  // Change '/prompt-gen-web/' to match your repository name
  // Use '/' for root domain or custom domain deployment
  base: process.env.NODE_ENV === 'production' ? '/prompt-gen-web/' : '/',
})
