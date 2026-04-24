# Dearly Noted

A personal CRM for gift-giving. Keeps track of the people you care about, the occasions coming up, what they've mentioned wanting, and what you've given before.

Previously known as **Gift Radar** (renamed April 24, 2026).

**Status:** Phase 2 — PWA install. Local-only, no backend, no accounts.

---

## Stack

- React + Vite (JavaScript)
- `localStorage` for persistence (key: `giftradar:data`)
- `lucide-react` for icons
- `vite-plugin-pwa` for service worker + manifest
- Deployed on Vercel

## Setup (Windows + PowerShell)

```powershell
# Clone
git clone https://github.com/<your-username>/dearly-noted.git
cd dearly-noted

# Install
npm install

# Run dev server
npm run dev
```

Open http://localhost:5173 in a browser.

## Build & preview production (tests the service worker)

```powershell
npm run build
npm run preview
```

The dev server (`npm run dev`) does **not** run the service worker by default — you need `build` + `preview` to actually exercise the PWA machinery.

## Deploy

Pushes to `main` auto-deploy to Vercel. That's it.

```powershell
git add .
git commit -m "your message"
git push
```

## PWA install (iOS)

1. Open the production URL in **Safari** (not Chrome on iOS — Chrome on iOS is Safari in a trench coat, but "Add to Home Screen" is still Safari-only for install).
2. Tap the Share button.
3. Scroll and tap **Add to Home Screen**.
4. Confirm the name shows as "Dearly Noted". Tap Add.
5. Launch from home screen → should open full-screen, no Safari chrome.

## PWA install (Android)

1. Open the production URL in Chrome.
2. Tap the three-dot menu.
3. Tap **Install app** (or "Add to Home Screen").
4. Confirm. Launch from home screen or app drawer.

## Project structure

```
dearly-noted/
├── public/
│   ├── icon-192.png              PWA icon, standard
│   ├── icon-512.png              PWA icon, large
│   ├── icon-512-maskable.png     Android adaptive icon (full-bleed)
│   ├── apple-touch-icon.png      iOS home screen icon
│   └── favicon-32.png            Browser tab icon
├── src/
│   ├── App.jsx                   Single-file React component (~900 lines)
│   ├── main.jsx                  Vite entry point
│   └── index.css                 Empty — styles are in App.jsx
├── index.html                    PWA meta tags live here
├── vite.config.js                VitePWA plugin config + manifest
└── package.json
```

## Data

All data lives in `localStorage` under the key `giftradar:data` (the key name predates the rename; it's internal-only and kept for continuity). Format:

```json
{
  "people": [...],
  "occasions": [...],
  "wishlist": [...],
  "gifts": [...]
}
```

Clear-browser-data wipes it. Export/import as JSON is planned for Phase 4.

## Phases

See `dearly-noted-plan.md` for the full roadmap.

- ✓ **Phase 1:** Port & deploy (April 21, 2026)
- ⏳ **Phase 2:** PWA install + rename (in progress)
- **Phase 3:** Local notifications
- **Phase 3.5:** Suggestions tab tease
- **Phase 4:** Export/import + onboarding
- **Phase 4.5:** AI gift suggestions (Anthropic API via Vercel serverless)
- **Phase 5:** Distribute to friends
