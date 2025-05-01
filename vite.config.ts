
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Add mainFields to ensure proper module resolution
    mainFields: ['browser', 'module', 'main'],
    // Add extensions to explicitly tell Vite which file extensions to look for
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    // Use esbuild for minification instead of terser
    minify: mode === 'production' ? 'esbuild' : false,
    // Cache busting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@tanstack/react-query'
          ],
          'ui': [
            '@/components/ui'
          ]
        }
      },
      // Add onwarn to handle circular dependency warnings
      onwarn(warning, warn) {
        // Ignore certain warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        warn(warning);
      }
    },
    // Reduce chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps only in development
    sourcemap: mode === 'development',
    // Add commonjsOptions to handle modules that use require
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
    // Force prebundle for problematic dependencies
    force: true
  }
}));
