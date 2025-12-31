import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large libraries
          'react-vendor': ['react', 'react-dom'],
          'motion-vendor': ['framer-motion'],
          'charts-vendor': ['recharts'],
          'date-vendor': ['date-fns'],
          // Group utilities
          'utils': [
            './src/utils/calculations.ts',
            './src/utils/animations.ts'
          ],
          // Group services
          'services': [
            './src/services/dataService.ts',
            './src/services/GoogleSheetsService.ts',
            './src/services/achievementService.ts',
            './src/services/analyticsService.ts',
            './src/services/aiAnalyticsService.ts'
          ],
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
    // Enable minification with esbuild (built-in, faster)
    minify: 'esbuild',
    target: 'es2015',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'recharts', 'date-fns'],
  },
  esbuild: {
    drop: ['console', 'debugger'], // Remove console.logs and debuggers in production
  },
});
