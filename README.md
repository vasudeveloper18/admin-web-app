# FieldOps Admin

Admin web app and NestJS API for field job dispatch.

## Setup (clean clone)

### Prerequisites

- **Node.js** 18+
- **MongoDB** on `mongodb://127.0.0.1:27017` (or Atlas via `MONGODB_URI`)

### Backend

```bash
cd backend
npm install
copy .env.example .env    # Mac/Linux: cp .env.example .env — set MONGODB_URI + JWT secrets
npm run seed
npm run start:dev
```

- API: `http://127.0.0.1:3001`
- Swagger: `http://127.0.0.1:3001/docs`
- Health: `GET /`

### Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local   # Mac/Linux: cp .env.local.example .env.local
```

Set in `frontend/.env.local` (optional — a fallback key is used in code if unset):

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:3001
GEOAPIFY_API_KEY=<your Geoapify key>
```

Restart the dev server after changing env:

```bash
npm run dev
```

- Admin UI: `http://localhost:3000`

### Demo credentials (after seed)

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@example.com` | `Admin123!` |
| Technician | `marcus@fieldops.com` | `TechPass123!` |

---

## Submission scope checklist

| Deliverable | Status |
|-------------|--------|
| Admin web (login, jobs list, create job, detail, assign/unassign/cancel, logout) | Implemented |
| REST API + Swagger at `/docs` | Yes |
| Postman collection (repo root) | Yes |
| RBAC (`ADMIN` / `TECHNICIAN`) | Yes |
| Job indexes | Below |

---

## Admin web flow (verify before submit)

1. **Login** — `/login` → httpOnly cookies, admin only on web BFF.
2. **Jobs list** — `/jobs` — server pagination, filters (status, technician, date range, search).
3. **Create job** — `/jobs/new` — Geoapify address autocomplete (US); must pick a suggestion (lat/lng stored).
4. **Job detail** — `/jobs/[id]` — assign / unassign / cancel; **completion photos** use public API URLs. On Vercel set `NEXT_PUBLIC_API_URL` to your API origin (see Production URLs).
5. **Logout** — profile menu; session cleared.

**Production admin:** set `NEXT_PUBLIC_API_URL` and optionally `GEOAPIFY_API_KEY` on Vercel, then redeploy.

---

## API documentation

| Resource | Location |
|----------|----------|
| Swagger (live) | `http://127.0.0.1:3001/docs` |
| Postman | `fieldops-admin-api.postman_collection.json` (repo root) |

**Admin API (Bearer token):** login, jobs CRUD/assign/unassign/cancel, technicians list, profile.

Completion photos on completed jobs are stored in **MongoDB GridFS** and served at `GET /uploads/files/:filename`. URLs use `API_BASE_URL` or Render `RENDER_EXTERNAL_URL`.

---

## Database indexes & `GET /jobs` performance

Indexes on `Job`:

| Index | Purpose |
|-------|---------|
| `status` | Filter by job status |
| `assignedTechnician` | Filter by technician |
| `scheduledDate` | Sort and date-range filters |
| `location` (2dsphere) | Geospatial data on jobs |

These indexes support admin `GET /jobs` filters, sort, and pagination.

---

## Architecture (summary)

- **Monorepo:** `backend/` (NestJS) + `frontend/` (Next.js App Router).
- **Auth:** JWT access + refresh; admin web stores tokens in **httpOnly cookies** via Next.js BFF (`/api/proxy`, `/api/auth/*`).
- **Validation:** class-validator (API) + Zod (create job form).
- **RBAC:** `ADMIN` vs `TECHNICIAN` on backend guards.

---

## Known limitations

- Geoapify: optional `GEOAPIFY_API_KEY` in `frontend/.env.local` / Vercel; address autocomplete uses a built-in fallback when env is not set.
- Completion photos in GridFS; re-complete a job if an old upload 404s after a pre-GridFS deploy.
- Set strong `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` on Render (defaults are local-dev only).

---

## Production URLs (reference)

| Service | URL |
|---------|-----|
| API | `https://admin-web-app-qn62.onrender.com` |
| Admin web | `https://admin-web-app-wgaj.vercel.app` |

Set `NEXT_PUBLIC_API_URL` in Vercel; set `MONGODB_URI` and JWT secrets on Render. Optional `GEOAPIFY_API_KEY` and `API_BASE_URL` if not using `RENDER_EXTERNAL_URL`.

---

## Quick verification (local)

```bash
cd backend && npm run build && npm run seed && npm run start:dev
cd frontend && npm run build && npm run dev
```

1. Admin: login → create job (address suggestion) → assign → view completed seed job photos.
2. Postman: import collection and exercise admin auth + jobs endpoints.
3. Swagger: `http://127.0.0.1:3001/docs`.

---

## Scripts

| Command | Where |
|---------|--------|
| `npm run seed` | `backend/` — reset demo data |
| `npm run build` | `backend/`, `frontend/` — verified passing |
| `npm run start:dev` | local development |
