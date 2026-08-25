# SCGS Deployment

How this server runs the app. Three pieces:

| Piece      | Runs as              | Port                    | What it is                                        |
| ---------- | -------------------- | ----------------------- | ------------------------------------------------- |
| MongoDB    | Docker `scgs-mongo`  | `127.0.0.1:27017`       | `mongo:7`, auth on, data in volume `deploy_scgs-mongo-data` |
| Backend    | pm2 `scgs-backend`   | `0.0.0.0:5000`          | Express + TypeScript (run via `tsx`), API at `/api` |
| Admin UI   | pm2 `scgs-admin`     | `0.0.0.0:3000`          | Vite/React build + reverse proxy `/api` → `:5000`   |

The admin SPA calls the API on its **own origin** (`fetch('/api/...')`, see
`admin/src/api.ts`). That is why `admin/server.mjs` proxies `/api` to the backend
instead of just serving static files — a plain static server would break every
admin request.

The backend also serves the same build at `http://<host>:5000/admin`, since
`vite build` outputs into `backend/public/admin`. Both URLs work; port 3000 is
the one to hand out.

## URLs

- Admin panel — `http://<host>:3000/` (sign in with `ADMIN_KEY` from `backend/.env`)
- API health — `http://<host>:5000/api/health`
- Rule book — `http://<host>:5000/api/rulebook`

## Configuration

- `backend/.env` — Mongo URI (with credentials), `PORT=5000`, `ADMIN_KEY`,
  `TOKEN_SECRET`, optional WhatsApp keys. Not committed (gitignored), mode 600.
- `deploy/.env` — Mongo root user/password used by docker compose. Not committed,
  mode 600. Must stay in sync with `MONGODB_URI` in `backend/.env`.
- `ecosystem.config.cjs` — pm2 process definitions, at the repo root.

## Day-to-day

```bash
pm2 status                              # what is running
pm2 logs scgs-backend --lines 100       # backend logs
pm2 logs scgs-admin                     # admin/proxy logs
pm2 restart scgs-backend --update-env   # after editing backend/.env
pm2 restart all
```

Logs also land in `deploy/logs/` and are rotated by `pm2-logrotate`
(10 MB, 7 files, compressed).

## Deploying a change

```bash
cd /home/ubuntu/SCGS-APP
git pull

# Backend changed:
cd backend && npm install && npm run typecheck && pm2 restart scgs-backend --update-env

# Admin UI changed (build output goes to backend/public/admin):
cd ../admin && npm install && npm run build && pm2 restart scgs-admin
```

## MongoDB

```bash
cd /home/ubuntu/SCGS-APP/deploy
docker compose ps
docker compose logs -f mongo
docker compose restart mongo
docker compose down          # stop (volume, and therefore data, is kept)
docker compose up -d
```

Shell into the database:

```bash
set -a; . deploy/.env; set +a
docker exec -it scgs-mongo mongosh -u "$MONGO_USER" -p "$MONGO_PASSWORD" \
  --authenticationDatabase admin scgs
```

Backup / restore:

```bash
docker exec scgs-mongo mongodump -u "$MONGO_USER" -p "$MONGO_PASSWORD" \
  --authenticationDatabase admin -d scgs --archive=/tmp/scgs.gz --gzip
docker cp scgs-mongo:/tmp/scgs.gz ./scgs-$(date +%F).gz
```

Port 27017 is published on loopback only — nothing outside the host can reach
the database directly.

## Roster data

The live directory came from `samaj_members_template.xlsx` in the repo root:

```bash
cd backend && npm run import              # repo-root spreadsheet
cd backend && npm run import other.xlsx   # explicit file
```

The importer **replaces the whole members collection**, so back up first:

```bash
set -a; . deploy/.env; set +a
docker exec scgs-mongo mongodump -u "$MONGO_USER" -p "$MONGO_PASSWORD" \
  --authenticationDatabase admin -d scgs --archive=/tmp/pre.gz --gzip
docker cp scgs-mongo:/tmp/pre.gz deploy/backups/scgs-$(date +%F-%H%M).gz
```

Each member's initial password is their own phone number, with
`mustChangePassword=true`. Rows with no phone are still imported so they appear
in the directory, but get a random password and cannot log in until an admin
adds a number. Governing-body portraits are carried across the wipe (the app
resolves them through `governingBody.samajId` -> `member.photo`).

`npm run seed` is the **demo** dataset (25 fake members, password `test123`) —
it wipes the real roster. Do not run it on this server.

## Boot behaviour

- Docker: `systemctl enable docker` + `restart: unless-stopped` on the container.
- pm2: `pm2 startup systemd` installed the `pm2-ubuntu` unit and `pm2 save`
  recorded the process list, so both apps come back after a reboot.

Re-save whenever you add or remove a pm2 process:

```bash
pm2 save
```

## Notes

- Nothing here terminates TLS. For public access put nginx/Caddy or a Cloudflare
  tunnel in front — production Android builds reject cleartext HTTP, so the
  mobile app needs an HTTPS origin (see `SETUP-NOTES.md` §3).
- The host firewall (`ufw`) is inactive; ports 3000/5000 are governed by the
  cloud security group.
