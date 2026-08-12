# MediTrack

Smart medication inventory management and shortage-prediction system for hospitals.

Monorepo: `/backend` (Express + PostgreSQL) and `/frontend` (React + Vite + Tailwind).

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL running locally (or a reachable Postgres instance)

## 1. Install dependencies

From the repo root (npm workspaces installs both `backend/` and `frontend/`):

```
npm install
```

## 2. Create the database

Connect to Postgres as a superuser (e.g. `psql -U postgres`) and run:

```sql
CREATE ROLE meditrack_user WITH LOGIN PASSWORD 'your_password_here';
CREATE DATABASE meditrack OWNER meditrack_user;
```

Then apply the schema:

```
psql "postgresql://meditrack_user:your_password_here@localhost:5432/meditrack" -f backend/db/schema.sql
```

## 3. Configure environment variables

Copy the example env files and fill in your own values:

```
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

In `backend/.env`, set `DATABASE_URL` to match the role/password/db you created in step 2, and pick your own `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (any random string — these are per-developer, not shared).

`frontend/.env` only needs `VITE_API_URL` (defaults to `http://localhost:4000/api`, fine for local dev).

## 4. (Optional) Seed dev data

Creates two test users and a handful of sample medications:

```
npm run --workspace=backend db:seed
```

Dev login after seeding: `pharmacist1` / `password123` (or `admin` / `password123`).

## 5. Run it

Two terminals, from the repo root:

```
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

Open http://localhost:5173 and log in.

## Tests

```
npm run test:backend
```

Runs against the same database configured in `backend/.env` — tests clean up after themselves but do write/read real rows, so don't point `DATABASE_URL` at a database you care about.
