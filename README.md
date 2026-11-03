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
