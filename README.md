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
copy .env.example .env
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
copy .env.local.example .env.local
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

## Admin web flow

1. **Login** — `/login` → httpOnly cookies, admin only on web BFF.
2. **Jobs list** — `/jobs` — server pagination, filters (status, technician, date range, search).
3. **Create job** — `/jobs/new` — Geoapify address autocomplete (US); must pick a suggestion (lat/lng stored).
4. **Job detail** — `/jobs/[id]` — assign / unassign / cancel; **completion photos** use public API URLs. On Vercel set `NEXT_PUBLIC_API_URL` to your API origin (see Production URLs).
5. **Logout** — profile menu; session cleared.
6. **Edit profile** — `/profile` — update name and email (`PATCH /me`); open from header menu → **Edit Profile**.

---

## API documentation

| Resource | Location |
|----------|----------|
| Swagger (live) | `http://127.0.0.1:3001/docs` |
| Postman | `fieldops-admin-api.postman_collection.json` (repo root) |

**Admin API (Bearer token):** login, jobs CRUD/assign/unassign/cancel, technicians list, profile.

---

## Database indexes & `GET /jobs` performance

Indexes on `Job`:

| Index | Purpose |
|-------|---------|
| `status` | Filter by job status |
| `assignedTechnician` | Filter by technician |
| `scheduledDate` | Sort and date-range filters |
| `location` | lat/long-based on jobs |

These indexes support admin `GET /jobs` filters, sort, and pagination.

---

## Architecture (summary)

- **Monorepo:** `backend/` (NestJS) + `frontend/` (Next.js App Router).
- **Auth:** JWT access + refresh on the API (`/auth/login`, `/auth/refresh`, `/auth/logout`).
- **Validation:** class-validator (API) + Zod (create job form).
- **RBAC:** `ADMIN` vs `TECHNICIAN` on backend guards.

---

## Production URLs (reference)

| Service | URL |
|---------|-----|
| API | `https://admin-web-app-qn62.onrender.com` |
| Admin web | `https://admin-web-app-wgaj.vercel.app` |

---

## Scripts

| Command | Where |
|---------|--------|
| `npm run seed` | `backend/` — reset demo data |
| `npm run build` | `backend/`, `frontend/` — verified passing |
| `npm run start:dev` | local development |
