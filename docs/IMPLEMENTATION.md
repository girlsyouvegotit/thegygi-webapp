# Implementation

GYGI is a Vite + React frontend and an Express 5 + TypeScript backend. Data lives in MongoDB through Mongoose. Live class presence uses Socket.IO. File uploads and recordings use UploadThing. Optional scheduled work uses Inngest. Optional writing help uses the Google Gemini key on the server only.

## Layout

```
frontend/     React app (Vite, Tailwind, React Router)
backend/      Express API, Socket.IO, Mongoose models
docs/         This documentation
```

Frontend scripts: `npm run dev`, `npm run build` (`tsc -b && vite build`).

Backend scripts: `npm run dev` (`tsx watch`), `npm run build` (`tsc`), `npm start` (`node dist/server.js`).

Local defaults: API on port 5000, frontend on port 5173.

## Request path

`backend/src/server.ts` mounts every router under `/api`. Health checks are `GET /` and `GET /health` (no `/api` prefix). UploadThing is `POST/GET /api/uploadthing`. Inngest is `/api/inngest`.

Typical JSON shape:

```json
{ "success": true, "message": "…", "data": {} }
```

Errors use the same envelope with `success: false`.

## Auth

Login and register (`POST /api/auth/login`, `POST /api/auth/register`) set an httpOnly JWT cookie and also return `data.accessToken`. The frontend stores that token in `sessionStorage` under `gygi_access` and sends `Authorization: Bearer` on API calls. The cookie remains a backup.

This exists because the site (for example `https://www.gygi.org`) and the API (for example `https://thegygi-webapp.onrender.com`) are different sites. A `SameSite=Lax` cookie is not sent on that cross-site request. In production, or when `CLIENT_URL` is `https://`, cookies are `Secure` and `SameSite=None`.

`protect` reads the bearer token or the cookie. `authorize(...)` checks the role. Super admin passes admin checks. Routes that must be super-admin-only use `superAdminOnly`.

Registration does not accept a role. New accounts are students. Password minimum is 6 characters.

Impersonation is a super-admin action. Stopping it returns a fresh access token for the real user.

## CORS

Allowed browser origins come from `CLIENT_URL`, comma-separated `SOCKET_CORS_ORIGIN`, plus `https://thegygi-webapp.vercel.app` and `https://gygingo.vercel.app`. Localhost is added only when `NODE_ENV` is `development`. `www.gygi.org` is allowed when `CLIENT_URL` or `SOCKET_CORS_ORIGIN` includes it. It is not hardcoded.

## Student counts

`Category` still stores `students`, `tutors`, and `mentors` arrays. Those arrays are not the source of truth for the number shown in the UI.

`category.service` recomputes `studentCount`, `tutorCount`, and `mentorCount` from currently active users and active enrollments, then returns those numbers on the category JSON so the Mongoose virtual (`students.length`) does not override them.

`deleteUser` and `suspendUser` pull the user id off category membership arrays and mark that student’s active enrollments as dropped.

Platform overview, community pulse, and admin analytics count active `role: "student"` users with `User.countDocuments`. They do not take the larger of “active students” and “distinct enrollment ids”, because enrollment rows can outlive a deleted user.

## Finance clear

`POST /api/finance/clear` is admin-only (super admin included). Body: `{ "section": "fees" | "expenses" | "salaries" | "all" }`. It `deleteMany`s those collections only, writes an activity log with the actor, section, and how many documents were removed, and does not log amounts. The Finance page asks for a second confirmation. If the chosen section is already empty in the loaded lists, it shows a toast and does not refetch.

## Frontend auth storage

`frontend/src/lib/session.ts` reads and writes the access token. `frontend/src/lib/api.ts` attaches it and, on 401, clears it and sends the user to `/login` except on public pages. Sockets and UploadThing calls to this API send the same bearer token. The JWT cookie is httpOnly, so client code cannot read it from `document.cookie`.

## Dashboards and time

`frontend/src/lib/greeting.ts` maps the device clock to Good morning (05:00–11:59), Good afternoon (12:00–16:59), Good evening (17:00–20:59), or Good night (21:00–04:59). Role dashboards use that string instead of “Welcome back”.

Dark mode is the `dark` class on `<html>` (next-themes). Dashboard shells set `data-dashboard-theme`. `frontend/src/index.css` remaps hard-coded light surfaces inside that shell so labels stay readable.

## Jobs

Alumni Ops “Live job feed” and the Jobs tab render `JobMatchCard` with `stacked={false}` inside a horizontal snap scroller. Apply now is a solid black button. A swipe cue shows when there is more than one card.

## What not to do

Do not commit `.env` files. Do not put secrets in any `VITE_` variable; Vite inlines those into the browser bundle. The Gemini key belongs only in `GOOGLE_GENERATIVE_AI_API_KEY` on the API.
