# stride


## PWA
- `manifest.webmanifest`, `sw.js`, `icons/` — install via Chrome > "Install app" (must be served over HTTPS).
- Streak only counts after a submitted test (updated in `test.html`).
- Notifications: local 7 PM streak reminder works out of the box. For true background push, set `ONESIGNAL_APP_ID` in `app.html`.

## v2
- Run `supabase_v2.sql` once in the Supabase SQL editor (explanations, dashboard settings, leaderboard options, target course).
- Admin > Plan tab > "Dashboard settings": exam countdown, target score, weekly goal, reminder hour/text, leaderboard period/subject/group.
- Missed-question bank and test resume are stored on the device (localStorage).
- OneSignal App ID is set in `app.html`; `sw.js` imports the OneSignal worker. Serve over HTTPS on the exact site URL registered in OneSignal.

## v7
- Run `supabase_v3.sql` once (subjects column, security hardening, indexes). Then run the AUDIT queries at the bottom of it.
- `app.css`, `test.css`, `index.css`, `theme.css`, `theme.js`, `subjects.js` are now separate cached files. Light/dark/auto: Profile > Appearance (or the round button on the login page).
- Data cache: question list (6 h), settings (10 min), tests (10 min, refreshed right after a test), leaderboard (5 min). Admin setting changes can take up to 10 minutes to reach students.
- Pages load from the saved copy first and update in the background, so a new version shows on the second open.
- `_headers` adds basic security headers on Netlify / Cloudflare Pages.

## v8
- New logo + transparent icons (`icons/`), white badge for Android notifications. Reinstall the PWA (or clear site data) to see the new home-screen icon.
- Run `supabase_v4.sql`: 7-day trial and the push scheduler (every 2 h, 7am to 9pm Lagos, only to students who have not studied today). Needs your OneSignal REST key saved in Vault and `site_url` set.
- Push needs: Android Chrome / installed PWA, notifications allowed, then Profile > Notifications > Enable once. iPhone: only works after Add to Home Screen (iOS 16.4+).

## v9
- New flat design (no gradients, glow, blur or glossy shadows). All styling tokens and animations live in `ui.css` (loaded last); `theme.css` is now empty. Light and dark share the same tokens.
- Login page is much lighter: the animated blurred glows, backdrop blur and halftone overlay are gone.
- Practice: your 4 JAMB subjects come first, then the rest of your stream (Sciences / Arts / Commerce), then everything else.
- Sign-up now also stores course + subjects in the account metadata, so a profile that failed to save can heal itself on first open (also when an old profile still says Sciences).
- Free trial is 7 days (run `supabase_v4.sql` once if you have not; the app reads `trial_days` from settings).
- Asset versions bumped to `?v=9` and service worker to `stride-v9` so phones fetch the new files.
