# Admin Web App

This is a full-stack web application designed for administrators to manage field operations, assign technicians to jobs, and track statuses in real-time.

## Setup Instructions

These instructions will guide you through running the application from a clean clone.

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB** running locally on default port `27017`.

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
npm install
```

Seed the database (this will create an admin user and some test technicians/jobs):
```bash
npx ts-node src/scripts/seed.ts
```

Start the development server:
```bash
npm run start:dev
```
The API runs at `http://localhost:3001` with Swagger docs available at `http://localhost:3001/docs`.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Start the development server:
```bash
npm run dev
```
Access the application at `http://localhost:3000`. You can log in using the demo credentials:
- Email: **admin@example.com**
- Password: **Admin123!**

---

## Architecture Decisions & Trade-offs

- **Monorepo-like Structure:** We kept the `frontend` and `backend` in the same repository for ease of deployment and shared context, though they have their own `package.json` files to maintain clean dependency boundaries.
- **NestJS (Backend):** Chosen for its strong architectural patterns, out-of-the-box TypeScript support, and built-in dependency injection, which allows the application to scale elegantly.
- **Next.js (Frontend):** Selected for its React Server Components, fast routing, and SEO optimization. We opted for a client-heavy approach (`'use client'`) for dashboards to support rich interactivity while relying on server actions where appropriate.
- **Zod Validation:** Used on both frontend and backend (via pipes) to ensure a single source of truth for schema validation and robust runtime safety.
- **Vanilla CSS / Inline Styles over Tailwind classes:** In certain areas, we opted for direct style application to bypass potential PostCSS/Tailwind compilation inconsistencies in Next.js 15 + Tailwind v4 setups, prioritizing a functional, pixel-perfect UI quickly over relying on the utility engine.

## Known Bugs and Rough Edges

- **Session Handling:** The JWT authentication is stored in cookies, but a robust automatic token refresh mechanism (using the refresh token) hasn't been completely wired into Axios interceptors on the frontend.
- **Pagination Sync:** The URL parameters control pagination, but navigating back and forth sometimes doesn't perfectly rehydrate the component state instantly.
- **Map View:** The job creation allows latitude/longitude entry, but there isn't a full visual map implementation (e.g., Google Maps API) for assigning technicians based on geographic proximity yet.

## What I Would Do with Two More Weeks

- **Interactive Maps Integration:** Add a map component showing the location of unassigned jobs and available technicians to optimize routing.
- **Real-time Updates:** Implement WebSockets (e.g., Socket.io or Server-Sent Events) so the admin dashboard updates instantaneously when a technician marks a job as "In Progress" or "Completed" in the field.
- **Testing Coverage:** Introduce robust End-to-End testing with Playwright or Cypress for critical flows (creating jobs, assigning technicians) and expand Jest coverage for all NestJS services.
- **Role-Based Access Control (RBAC):** Build out a more granular permissions system, differentiating between Super Admins, Dispatchers, and Read-Only viewers.
- **CI/CD Pipeline:** Add GitHub Actions to automatically run linters, build checks, and tests on every Pull Request.
