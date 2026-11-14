# ServiceHub Admin Dashboard

React admin console for the Service Provider platform. It connects directly to
the Express API in `../ServiceProviderBackend` and lets admins manage bookings
and the service catalogue.

## Features

- **Admin authentication** with the email and password configured on the
  backend (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). No Firebase or JWT needed in the
  dashboard — the API validates HTTP Basic credentials.
- **Overview dashboard** with user, service, revenue, complaint/query stats and
  a booking-status breakdown.
- **Bookings** list with status filters, pagination, booking details, and
  status transitions (confirm → start → complete).
- **Create booking** with service/quantity/date selection and saved-address
  selection, including an inline form to add a new address.
- **Services** management: search, category and status filters, create/edit,
  activate/deactivate, and category creation.

## Tech stack

- React 19 + TypeScript + Vite
- React Router
- TanStack Query
- Axios
- Lucide icons
- Plain CSS (no UI framework)

## Project structure

```
src/
  api/          # Endpoint wrappers (auth, admin, bookings, services, users)
  components/   # Layout, modals, toasts, badges, pagination, shared states
  context/      # Auth/session provider
  lib/          # Axios client, session helpers, formatting helpers
  pages/        # Login, Dashboard, Bookings, Create Booking, Services
  types.ts      # API response and domain types
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the environment:

   ```bash
   copy .env.example .env
   ```

   | Variable | Description |
   | --- | --- |
   | `VITE_API_BASE_URL` | Backend API root, e.g. `http://localhost:3000/api/v1` |

   The admin email and password are **not** stored in the dashboard
   environment. Configure them in the backend instead:

   ```bash
   # inside ServiceProviderBackend/.env
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=change-this-password
   ```

3. Start the backend (see `../ServiceProviderBackend/README` or run
   `npm run dev` inside that folder), then start the dashboard:

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173`.

## Admin access

Sign in with the credentials from the backend environment. On the first
successful login, the backend automatically creates the admin user if it does
not exist (or reuses the existing account with that email).

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in
   `ServiceProviderBackend/.env`.
2. Restart the backend.
3. Open the dashboard and sign in with the same email and password.

The dashboard sends `Authorization: Basic <base64(email:password)>` with each
request and keeps the session in `sessionStorage`. The password never leaves
the backend config; change it there and restart the API to rotate access. Use
HTTPS in production because Basic credentials are only encoded, not encrypted.

Existing JWT (Bearer) authentication remains available on the backend for the
mobile app — the dashboard simply does not use it.

## API endpoints used

| Area | Endpoints |
| --- | --- |
| Auth | `GET /users/me` (HTTP Basic) |
| Overview | `GET /admin/stats`, `GET /admin/bookings` |
| Bookings | `GET /admin/bookings`, `POST /bookings`, `PATCH /bookings/:id/status` |
| Services | `GET /services`, `POST /services`, `PATCH /services/:id`, `DELETE /services/:id` |
| Categories | `GET /categories`, `POST /categories` |
| Addresses | `POST /users/me/addresses` |

## Notes

- New bookings are created with `pending` status. Use the **Confirm** action on
  the Bookings page to move them through `confirmed → in_progress → completed`.
- `POST /bookings` books on behalf of the signed-in account and requires one of
  that account's saved addresses. The Create Booking page surfaces this and
  lets you add an address inline.
- The backend must allow CORS from the dashboard origin. The current backend
  uses `cors()` with no restrictions, so local development works out of the
  box.
- Set `VITE_API_BASE_URL` to your deployed API URL when building for
  production.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run TypeScript checks only |
