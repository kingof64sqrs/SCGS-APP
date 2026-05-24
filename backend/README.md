# SCGS Backend

REST API backend for the **Shree Coimbatore Gujarati Samaj (SCGS)** mobile app.

Built with Node.js + TypeScript, Express, the official MongoDB native driver
(single shared, pooled `MongoClient`), and `zod` for validation. Run directly
with [`tsx`] (no build step required for dev/run).

## Project structure

Layered + feature-based. `infrastructure` owns external concerns, `core` holds
cross-cutting building blocks, and each `features/<x>` folder is self-contained
(`routes` → `service` → `model`, with `schema` for validation/types).

```
src/
  main.ts                     # entrypoint: connect DB, start server
  app.ts                      # assembles Express app + mounts feature routers
  config/
    env.ts                    # typed environment config
  core/                       # cross-cutting building blocks
    errors/http-error.ts      # HttpError / BadRequestError / NotFoundError
    middleware/               # async-handler, error-handler, not-found, request-logger
    validation/validate.ts    # zod body-validation middleware
  infrastructure/             # external systems
    database/mongo.ts         # pooled MongoClient (connect/getDb/close)
    http/server.ts            # listen + graceful shutdown
  features/                   # one folder per domain
    auth/                     # auth.routes · auth.service · auth.schema
    members/                  # member.routes · member.service · member.model · member.schema
    governing-body/           # *.routes · *.service · *.model · *.schema
    about/                    # *.routes · *.service · *.model · *.schema
    facilities/               # *.routes · *.service · *.model · *.schema
  seed/
    seed.ts                   # validates data via schemas, wipes + inserts
    data/                     # members/governing-body/about/facilities seed data
```

**Per-feature layers:** `routes` (HTTP wiring + validation) → `service`
(business logic) → `model` (Mongo data access); `schema` (zod) is the source of
truth for each feature's shape and inferred types.

## Requirements

- Node.js v20+
- MongoDB reachable at `mongodb://127.0.0.1:27017` (database `scgs`)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # adjust if needed
```

### Environment variables (`.env`)

| Var          | Default                        | Description          |
| ------------ | ------------------------------ | -------------------- |
| `MONGODB_URI`| `mongodb://127.0.0.1:27017`    | MongoDB connection   |
| `DB_NAME`    | `scgs`                         | Database name        |
| `PORT`       | `4000`                         | HTTP listen port     |

## Commands

| Command             | What it does                                            |
| ------------------- | ------------------------------------------------------- |
| `npm run seed`      | Wipe + insert seed data, create indexes, then exit      |
| `npm run dev`       | Start server with file watch (`tsx watch`)              |
| `npm start`         | Start server (`tsx src/main.ts`)                        |
| `npm run typecheck` | Type-check with `tsc --noEmit`                          |

Typical first run:

```bash
npm install
npm run seed
npm start
```

The server graceful-shuts-down on `SIGINT` / `SIGTERM` (closes DB + HTTP server).

## API

Base path: `/api`. CORS is enabled for all origins. All responses are JSON.

| Method | Path                      | Response                                                        |
| ------ | ------------------------- | -------------------------------------------------------------- |
| GET    | `/api/health`             | `{ status: "ok", time: "<ISO>" }`                              |
| POST   | `/api/auth/login`         | `{ token, user: { name, email } }` (400 if email/password empty)|
| GET    | `/api/members`            | `Member[]` sorted by `samajId`                                 |
| GET    | `/api/members/:samajId`   | single `Member` or 404 `{ error: "Member not found" }`         |
| GET    | `/api/governing-body`     | `[{ group, members: [{ name, position, photoUrl }] }]`         |
| GET    | `/api/about`              | `{ title, paragraphs, facts, contact, facilities, services }`  |
| GET    | `/api/facilities`         | `Facility[]` (`{ name, description }`)                         |

### Types

```ts
Member = { samajId, name, phone, email, address, bloodGroup }
Facility = { name, description }
```

### Auth (dummy)

`POST /api/auth/login` accepts **any** non-empty `email` + non-empty `password`
and returns a random hex token plus a user whose `name` is derived (title-cased)
from the email local-part. Empty/missing email or password returns
`400 { error: "Email and password are required" }`.

## Notes

- Single pooled `MongoClient` (`maxPoolSize: 100`), connected once at startup and
  reused across requests — non-blocking and suitable for high concurrency.
- All route handlers are async and wrapped (`asyncHandler`) so rejected promises
  are caught by the global error middleware and returned as JSON 500s.
