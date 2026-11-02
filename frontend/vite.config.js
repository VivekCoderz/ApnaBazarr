import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Start downloading the catalogue (GET /products) while the JS bundle is still loading,
// instead of after React's first render. The app's fetch() reuses this response.
// Only added when VITE_API_URL is set, so the URL is never a broken placeholder.
function preloadCatalogue(apiUrl) {
  return {
    name: 'preload-catalogue',
    transformIndexHtml() {
      if (!apiUrl) return [];
      return [{
        tag: 'link',
        attrs: { rel: 'preload', href: `${apiUrl.replace(/\/$/, '')}/products`, as: 'fetch', crossorigin: 'anonymous' },
        injectTo: 'head'
      }];
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      tailwindcss(),
      preloadCatalogue(env.VITE_API_URL),
    ],
    build: {
      rollupOptions: {
        output: {
          // React + router change far less often than the store code: a separate chunk
          // stays cached in shoppers' browsers across our deploys.
          codeSplitting: {
            groups: [
              { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            ],
          },
        },
      },
    },
    server: {
      proxy: {
        '/auth': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/products': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          // public/products/*.jpg|webp are static images, not API calls
          bypass: (req) => (/\.(jpe?g|png|webp|avif)$/i.test(req.url.split('?')[0]) ? req.url : undefined),
        },
        '/orders': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})
