# Dearly Noted — Project Plan
*Version 0.4 — updated April 24, 2026: renamed from Gift Radar, Phase 2 in progress*

> **Rename history:** Originally "Gift Radar." Renamed to "Dearly Noted" on April 24, 2026
> as part of Phase 2. The `STORAGE_KEY` and internal CSS class prefix (`gr-`) still reference
> the old name — these are internal-only and kept to preserve localStorage data continuity.

---

## 0. Confirmed assumptions

These were challenged and confirmed in earlier discussion:

1. ✓ **You code professionally** (C++/Python background). JavaScript/React picked up quickly.
2. ✓ **Personal/friends-and-family tool first**, but open to strangers eventually. No accounts/sync yet, but path kept open.
3. ✓ **You're doing the build yourself.**
4. ✓ **Budget: ~$0** for v1.
5. ✓ **Phone-first** experience (PWA).
6. ✓ **No rush, but ship quickly** so you can move on to other projects.
7. ✓ **Name: "Dearly Noted"** (renamed from "Gift Radar" during Phase 2). Domain decision deferred.
8. ✓ **Aesthetic stays** (paper / editorial look). Radar brand mark retained for now — may revisit since it clashes with the note/paper metaphor in the new name.
9. ✓ **Dev environment:** native Windows + PowerShell + Node LTS (no WSL or VM).

---

## 1. What we're building

A personal CRM (Customer Relationship Management — software pattern for tracking people + structured info about them, applied here to gift-giving instead of sales). Log people you care about, capture things they mention wanting, log gifts you've given with reactions, and the app surfaces who has an occasion coming up + what they've expressed wanting.

**Working thesis:** low-friction capture + data that compounds over time = a tool that gets dramatically better in year two than year one.

**Hardest problem:** cold start. Getting users to enter data before they see value. Tech is easier than this.

---

## 2. Target user (v1)

**Primary:** You. Then 5–10 close friends/family you can hand this to and ask for honest feedback.

**Persona:** Someone with 5–20 important relationships, gives gifts at least monthly across the year, feels low-grade guilt about being scattered with it.

**Explicit non-targets for v1:**
- People who only buy gifts twice a year
- Wedding/event gift planners
- Anyone wanting AI gift recommendations without inputting any data

---

## 3. MVP scope

### In scope
- Add/edit/delete people with name, relationship, notes
- Flexible occasion system per person — preset list (Birthday, Anniversary, Christmas, Valentine's Day, New Year's Day, Halloween) plus Custom. Fixed-date holidays only.
- Wishlist per person — name (required), notes, price range (optional), product link (optional)
- Gift history (giving only) — date, occasion, price, reaction (landed/neutral/missed), notes
- "Upcoming" view (next 90 days, sorted soonest first)
- "People" list view sorted by next occasion
- Person detail with prep brief
- Suggestions tab with "Coming Soon" tease (Phase 3.5)
- AI gift suggestions (Phase 4.5)
- Local notifications for upcoming occasions (PWA)
- Installable as PWA on iPhone and Android
- Works offline (local-first)
- Export/import data as JSON

### Explicitly out of scope for v1
- User accounts, login, cross-device sync
- Sharing wishlists with others
- Receiving gifts (giver-only product)
- Moving holidays (Easter, Mother's Day, Hanukkah, Diwali, Eid)
- Affiliate purchase links, social features
- Conversation/text scanning, voice capture, photo OCR
- Importing from contacts or calendar
- Native iOS/Android apps

---

## 4. Tech stack (in use)

| Layer | Choice | Status |
|---|---|---|
| Framework | React + Vite | ✓ Phase 1 |
| Language | JavaScript | ✓ Phase 1 |
| Styling | Inline CSS / CSS-in-JS | ✓ Phase 1 |
| Storage | localStorage | ✓ Phase 1 |
| Hosting | Vercel | ✓ Phase 1 |
| Version control | GitHub | ✓ Phase 1 |
| Icon library | lucide-react | ✓ Phase 1 |
| PWA | vite-plugin-pwa v1.2 | ⏳ Phase 2 (in progress) |
| AI suggestions | Vercel serverless + Anthropic API | Phase 4.5 |
| Domain | Deferred — using `*.vercel.app` | Optional |

### Stack we're explicitly NOT using yet
- No backend other than the future serverless function for AI
- No database
- No auth provider
- No TypeScript (can migrate later)
- No state management library — `useState` is enough
- No testing framework for v1

---

## 5. Data model (current as of Phase 1)

Four collections in localStorage under key `giftradar:data` (key name kept from pre-rename for data continuity).

### `people`
```
id, name, relationship, notes, createdAt
```

### `occasions`
```
id, personId, type, customName (only if type === 'Custom'),
date (full ISO date), createdAt
```

`type` is one of: `Birthday`, `Anniversary`, `Christmas`, `Valentine's Day`, `New Year's Day`, `Halloween`, `Custom`.

For recurrence, use the MM-DD portion of `date` to calculate "days until next occurrence." For Birthday, also use the year to display "turning X."

### `wishlist`
```
id, personId, item (required), notes, priceRange (optional),
link (optional URL), capturedAt, status (open | purchased | dismissed)
```

The `link` field renders as "View product →" with an external-link icon.

### `gifts`
```
id, personId, item, date, occasion, price, reaction, notes
```

---

## 6. Architecture

```
┌────────────────────────────────────────┐
│  User's Phone (Browser or PWA install) │
│  ┌──────────────────────────────────┐  │
│  │  React App (Vite-built)          │  │
│  │  - All UI / logic                │  │
│  │  - PWA service worker (Phase 2)  │  │
│  └────────────┬─────────────────────┘  │
│               ▼                         │
│  ┌──────────────────────────────────┐  │
│  │  localStorage                    │  │
│  │  - people, occasions,            │  │
│  │    wishlist, gifts               │  │
│  └──────────────────────────────────┘  │
└──────────┬─────────────────────────────┘
           │
           ├──────────────────────────────┐
           ▼                               ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│  Vercel CDN         │    │  Vercel Serverless Function  │
│  - Static files     │    │  /api/suggest (Phase 4.5)    │
│  - Free SSL         │    │  - Calls Anthropic API       │
└─────────────────────┘    └──────────────────────────────┘
```

**Trade-off:** data doesn't sync across devices yet. Export/import JSON in Phase 4 is the backup mechanism.

---

## 7. Feature build order

### ✓ Phase 1 — Port & deploy (DONE April 21, 2026)
- Vite project set up
- Component ported from artifact, localStorage swapped in
- Occasions system replaces hardcoded birthday/anniversary
- `link` field added to wishlist
- `direction` removed from gifts (giving only)
- Pushed to GitHub, deployed to Vercel
- Live URL working on phone

### ⏳ Phase 2 — PWA install + rename to Dearly Noted (IN PROGRESS, April 24, 2026)
- Renamed app from "Gift Radar" to "Dearly Noted" across brand touchpoints, manifest, title, footer
- Renamed GitHub repo `gift-radar` → `dearly-noted`
- Renamed Vercel project to match (`*.vercel.app` URL updated)
- Installed `vite-plugin-pwa`
- Generated placeholder icons (DN monogram, cream on terracotta) — to be replaced later
- Added PWA manifest inline in `vite.config.js` (name, theme `#B5502F`, background `#F1EADC`, `display: standalone`)
- Added service worker with Workbox runtime caching for Google Fonts
- Added iOS-specific meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-title`)
- Auto-update behavior selected (`registerType: 'autoUpdate'`) — no reload prompts
- Test "Add to Home Screen" on iOS Safari and Android Chrome
- Verify full-screen launch with custom icon

### Phase 3 — Notifications
- Notification permission request (after first person added, not on first load)
- Schedule local notifications for upcoming occasions
- Per-person "remind me X days before" setting
- Handle iOS quirks (web push only on installed PWAs, iOS 16.4+)

### Phase 3.5 — Suggestions tab tease
- Add "Suggestions" tab
- Render data-aware "Coming Soon" content using actual user data
- No backend wiring — purely local reads

### Phase 4 — Polish + export
- Export to JSON (data backup)
- Import from JSON (data restore)
- First-run onboarding (force 1 person + 1 occasion)
- Settings page
- Bug fixes from real use

### Phase 4.5 — AI gift suggestions
- `/api/suggest` Vercel serverless function
- Anthropic SDK + Claude Haiku, API key in Vercel env vars
- Function input: person info + wishlist + gift history + occasion + budget
- Function output: 3–5 ranked suggestions, referencing wishlist where possible
- Replace "Coming Soon" with real generated suggestions
- Rate limit by IP (20 req/day) to prevent abuse
- Set hard spend cap on Anthropic account

### Phase 5 — Distribute
- (Optional) buy domain
- One-page landing or really good in-app onboarding
- Send to 10 friends with personal note
- Set up feedback collection
- Use it daily yourself

---

## 8. Cost breakdown

| Item | Cost | Status |
|---|---|---|
| Vercel hosting + serverless | $0 (free tier) | ✓ active |
| GitHub | $0 | ✓ active |
| Node.js / dev tools | $0 | ✓ active |
| Anthropic API (Claude Haiku) | ~$0–5/month at v1 scale | Phase 4.5 |
| Domain name | ~$10–15/year | Optional |
| App icon design | $0 (DIY placeholder for now) to ~$200 (Fiverr) | Phase 2 placeholder done |

**Spent so far: $0.**

---

## 9. Realistic timeline

- ✓ **Phase 1: DONE** — completed April 21, 2026
- ⏳ **Phase 2:** IN PROGRESS, started April 24, 2026
- **Phase 3:** ~2–3 evenings
- **Phase 3.5:** ~1 evening
- **Phase 4:** ~2–3 evenings
- **Phase 4.5:** ~2–3 evenings
- **Phase 5:** start when ready

Estimated remaining: ~2 weeks of evening/weekend work.

---

## 10. Post-MVP roadmap

Only relevant if v1 actually gets used.

### Tier 1 — High value, moderate effort
- Cloud sync (Supabase) — data isn't trapped on one device
- User accounts — required for sync
- Quick capture via share sheet
- "Mark as purchased" → moves wishlist item to gift history
- Snooze/dismiss for upcoming occasions

### Tier 2 — High value, more effort
- Moving holidays (Easter, Mother's Day) with proper recurrence rules
- Calendar integration — sync birthdays from device calendar
- Contact import — bulk-add people
- Recurring "just because" reminders
- AI quality improvements (feedback loop on suggestions)
- Rebrand visual identity (replace radar sweep with paper/note motif to match name)
- Proper custom icon (replace DN monogram placeholder)

### Tier 3 — Maybe never
- Native iOS/Android apps (only if PWA hits a real wall)
- Affiliate purchase links (only if monetizing)
- Social/sharing
- Conversation scanning (privacy nightmare)

---

## 11. Risks and unknowns

### Risk: iOS PWA notification limitations
iOS web push works on iOS 16.4+ but only for installed PWAs and is less reliable than native. **Mitigation:** test early in Phase 3 on actual iPhone. If unreliable, fallback options need backend infra; punt to post-MVP.

### Risk: Cold start (the real risk)
Product only works once data is in. People install, add 1 person, get bored, never return. **Mitigation:** Phase 4 onboarding forces 1 person + 1 occasion. Suggestions tab (Phase 3.5) coaches further data entry.

### Risk: AI suggestions are mediocre
Generic AI output kills the feature on first impression. **Mitigation:** test extensively with real data before flipping the feature on. Iterate prompt before exposing to friends.

### Risk: localStorage data loss
Browser cache clear → everything gone. **Mitigation:** export-to-JSON in Phase 4 + 30-day backup prompt.

### Risk: API key abuse (Phase 4.5)
Public `/api/suggest` endpoint could be scraped. **Mitigation:** rate limit by IP in serverless function. Set hard spend cap on Anthropic account.

### Risk: You build it and don't use it yourself
The single best signal this product is worth pursuing is whether *you* open it daily. If after 2 weeks of v1 you don't, that's the answer.

### Risk: Service-worker caching masks deploy bugs during Phase 2
After a bad deploy, users on an old SW may see stale assets. **Mitigation:** `registerType: 'autoUpdate'` + `skipWaiting` Workbox default means new SW activates on next load. Manual browser cache clear is the escape hatch.

### Unknown: Whether the cold-start problem is solvable
Many gift apps have died here. The thesis (occasion calendar + wishlist + AI) is unproven.

---

## 12. What success looks like

### v1 success (end of Phase 5)
- Live URL on phones
- 5–10 friends/family using it
- You've used it yourself for 2+ weeks
- 3+ people have triggered a notification and acted on it
- AI suggestions getting tapped

### Failure signal (kill or pivot)
- After 6 weeks, fewer than 3 people including you opening it weekly
- AI suggestions ignored or actively unhelpful
- Everyone says "neat" but doesn't add data beyond initial dump

---

## 13. Open questions / deferred decisions

- **Privacy stance:** deferred until cloud sync is on the table
- **Domain:** deferred — `*.vercel.app` works for v1
- **App icon design:** placeholder DN monogram in place; proper design deferred to post-Phase 2
- **Visual identity reconciliation:** radar sweep animation in header vs. "Dearly Noted" name — keep, replace, or hybrid? Defer until v1 usage data exists.

---

*End of plan v0.4*
