# ServiceHub Admin Dashboard

React admin console for the Service Provider platform. It connects directly to
the Express API in `../ServiceProviderBackend` and lets admins manage bookings
and the service catalogue.

## Features

- **Admin authentication** via Firebase email/password (exchanged for the
  backend JWT) or by pasting an existing admin JWT.
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
  lib/          # Axios client, Firebase REST auth, formatting helpers, session
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
   | `VITE_FIREBASE_API_KEY` | Firebase Web API key (optional, enables email/password sign-in) |

3. Start the backend (see `../ServiceProviderBackend/README` or run
   `npm run dev` inside that folder), then start the dashboard:

   ```bash
   npm run dev
   ```

   The app runs at `http://localhost:5173`.

## Admin access

The API only allows users with the `admin` role to call the admin endpoints.
Create or promote an admin in the backend:

```bash
# inside ServiceProviderBackend
npm run make-admin -- admin@example.com
```

For **Firebase sign-in**, make sure the same email exists as a Firebase Auth
user in the project configured on the backend, and add the project's Web API
key as `VITE_FIREBASE_API_KEY`. The dashboard signs in with Firebase, sends the
ID token to `POST /auth/verify`, and stores the returned JWT.

For **access-token sign-in**, paste a valid backend JWT (returned by
`POST /auth/verify` for an admin account). This is useful for local testing
without a Firebase web app.

## API endpoints used

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/verify`, `GET /users/me` |
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
