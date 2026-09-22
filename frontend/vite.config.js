const path = require('path');
const { defineConfig } = require('vite');
const reactPlugin = require('@vitejs/plugin-react');
const createViteHealthPlugin = require('./plugins/health-check/vite-health-plugin');

const react = reactPlugin.default || reactPlugin;

module.exports = defineConfig(() => ({
  plugins: [
    react(),
    process.env.ENABLE_HEALTH_CHECK === 'true' && createViteHealthPlugin(),
  ].filter(Boolean),
  publicDir: false,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/.git/**', '**/build/**', '**/dist/**', '**/coverage/**'],
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
}));


