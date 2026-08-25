# SCGS App — Setup & Operations Notes

Reference for files that live outside the source tree and the manual steps
needed to finish push-notification setup. Keep this file up to date.

---

## 1. Rule Book PDF

- **Lives at:** `backend/assets/rulebook.pdf`
- **Served by the API at:**
  - `GET /api/rulebook` → view inline
  - `GET /api/rulebook?download=1` → force download
- **In the app:** drawer → **Rule Book**, and the Home → Quick Access **Rule Book** tile.

### To update the rule book later
1. Replace the file:
   ```bash
   cp "/path/to/new-rulebook.pdf" backend/assets/rulebook.pdf
   ```
2. Restart the backend so it serves the new file:
   ```bash
   pm2 restart scgs-backend --update-env
   ```
No code change is needed — same URL, new file.

---

## 2. Firebase / FCM for push notifications (Android)

Push to a **closed** app on Android requires FCM. FCM is **free**. The Firebase
project is **`scgs-app`**, Android package **`com.kingof64sqrs.mobile`**.

- **`google-services.json` lives at:** `mobile/google-services.json`
  (gitignored — it holds project keys, so it is NOT committed).
- **`app.json`** already points at it:
  ```json
  "android": {
    "package": "com.kingof64sqrs.mobile",
    "googleServicesFile": "./google-services.json"
  }
  ```
- The `expo-notifications` plugin is configured in `app.json`.

### Remaining manual steps (run once)

1. **Upload the FCM V1 service-account key to Expo** so Expo's push service can
   deliver to the app:
   ```bash
   cd mobile
   eas credentials
   ```
   - Android → your project → **Push Notifications: Manage your FCM V1
     credentials** → **upload a service account key**.
   - Get the key from Firebase: **Project settings ⚙ → Service accounts →
     Generate new private key** (downloads a JSON). Select that file.

2. **Build + install:**
   ```bash
   cd mobile
   eas build --profile preview --platform android
   ```
   Install the APK on the device. **Uninstall Expo Go** so its old notifications
   stop appearing.

3. **Verify:** open the app, log in once (registers the device's push token),
   then send a **Broadcast** from the admin panel (or add an event). The
   notification should arrive with the app closed, show the SCGS icon, and open
   the app on tap. The admin Broadcast result shows `pushAccepted` / `tokenCount`.

> iOS: `eas build --platform ios` handles APNs automatically with a paid Apple
> Developer account. No google-services.json equivalent is needed.

### Note on the no-Firebase fallback (already in the app)
Even without FCM, the app shows **local notifications** (banner + sound) while it
is open or when reopened (polls every 45s + on foreground), and the in-app
Notifications screen always lists everything. FCM only adds delivery to a
**closed / killed** app.

---

## 3. Backend API URL used by the app

- The built app reads `EXPO_PUBLIC_API_URL` (see `mobile/eas.json` build
  profiles → currently the HTTPS Cloudflare tunnel).
- **Use the HTTPS tunnel, not `http://<ip>:5000`** — production Android builds
  block cleartext HTTP. (The API listens on port **5000** on the server; see
  `deploy/README.md`.)
- The Cloudflare quick-tunnel URL is **ephemeral** (changes if the tunnel
  restarts). For a stable URL, set up a named Cloudflare tunnel and update
  `mobile/eas.json` + `mobile/app.config.ts` `DEFAULT_API_URL`.

---

## 4. Other data files

- **Member roster import:** `samaj_members_template.xlsx` (repo root) was
  imported via `cd backend && npm run import` — 2,222 members. Re-running it
  replaces the whole members collection; see `deploy/README.md`.
- **Dummy events with banners:** `cd backend && npm run seed:events`.
- **Admin panel:** `http://<host>:3000/` (also served by the API at
  `http://<host>:5000/admin`), key `ADMIN_KEY` in `backend/.env` — can be
  changed in the admin Settings tab.

---

## 5. How the server runs it

MongoDB in Docker, backend and admin panel under pm2:

| Piece    | Process             | Port              |
| -------- | ------------------- | ----------------- |
| MongoDB  | Docker `scgs-mongo` | `127.0.0.1:27017` |
| Backend  | pm2 `scgs-backend`  | `5000`            |
| Admin UI | pm2 `scgs-admin`    | `3000`            |

Full operational detail — config files, restart/deploy commands, backups — is in
**`deploy/README.md`**.
