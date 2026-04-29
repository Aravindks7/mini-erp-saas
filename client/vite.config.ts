import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split out the absolute largest ones first
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor';
            }
            // Group by category
            if (
              id.includes('react') ||
              id.includes('scheduler') ||
              id.includes('react-router') ||
              id.includes('remix-run')
            ) {
              return 'framework-vendor';
            }
            if (id.includes('zod') || id.includes('hook-form')) {
              return 'data-vendor';
            }
            if (
              id.includes('radix-ui') ||
              id.includes('cmdk') ||
              id.includes('vaul') ||
              id.includes('sonner')
            ) {
              return 'ui-vendor';
            }
            // General dependencies
            return 'vendor';
          }
        },
      },
    },
  },
});
