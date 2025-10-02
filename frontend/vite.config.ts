import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

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
    {
      name: 'cache-bust',
      transformIndexHtml(html: string) {
        const timestamp = Date.now();
        return html.replace(
          /(href|src)="([^"]*\.(css|js))"/g,
          (match: string, attr: string, url: string, ext: string) => `${attr}="${url}?v=${timestamp}"`
        );
      }
    },
    {
      name: 'copy-headers',
      closeBundle() {
        if (fs.existsSync('public/_headers')) {
          if (!fs.existsSync('dist')) {
            fs.mkdirSync('dist', { recursive: true });
          }
          fs.copyFileSync('public/_headers', 'dist/_headers');
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for smaller build
    emptyOutDir: true, // Ensure clean builds
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },
  define: {
    // This helps with build optimization
    'process.env.NODE_ENV': JSON.stringify(mode),
    'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString())
  }
}));
