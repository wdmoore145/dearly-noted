import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Silent auto-update: on next page load after a deploy, users get the
      // new version without a prompt. Simpler UX for a personal-scale app.
      registerType: 'autoUpdate',

      // Ensure these files are included in the service worker's pre-cache
      includeAssets: ['apple-touch-icon.png', 'favicon-32.png'],

      // Inline manifest — vite-plugin-pwa generates manifest.webmanifest from this
      manifest: {
        name: 'Dearly Noted',
        short_name: 'Dearly Noted',
        description: 'A quiet radar for the gifts you plan to give.',
        theme_color: '#B5502F',
        background_color: '#B5502F',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        // Pre-cache all build output
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

        // Runtime caching: the app pulls Fraunces + Geist from Google Fonts.
        // Without this, the PWA would look wrong offline (system fonts).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },

      // Dev options: set to true if you want to test the SW during `vite dev`.
      // Usually easier to test with `vite preview` after `vite build`.
      devOptions: {
        enabled: false
      }
    })
  ]
})
