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
      name: 'copy-vercel-files',
      closeBundle() {
        if (!fs.existsSync('dist')) {
          fs.mkdirSync('dist', { recursive: true });
        }
        
        // Copy all Vercel config files
        if (fs.existsSync('public/_headers')) {
          fs.copyFileSync('public/_headers', 'dist/_headers');
        }
        
        if (fs.existsSync('public/_redirects')) {
          fs.copyFileSync('public/_redirects', 'dist/_redirects');
        }
        
        if (fs.existsSync('public/vercel.txt')) {
          fs.copyFileSync('public/vercel.txt', 'dist/vercel.txt');
        }
        
        // Create a web.config file for IIS servers
        const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
      <mimeMap fileExtension=".css" mimeType="text/css" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(assets|icons)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>`;
        fs.writeFileSync('dist/web.config', webConfig);
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
