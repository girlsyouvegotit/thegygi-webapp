# Deployment

The frontend is a static Vite build. The backend is a Node server that must run continuously because it serves HTTP and Socket.IO.

Current production hosts used by this project:

| Piece | Host |
| --- | --- |
| Site | `https://www.gygi.org` (also the Vercel project `thegygi-webapp`) |
| API and sockets | `https://thegygi-webapp.onrender.com` |

Deploy the API and the site together when auth changes. An old frontend cannot store the bearer token, and an old API will not return it.

## Backend on Render

Root directory: `backend`.

Build command must install TypeScript and `@types/*`. Those are devDependencies. If `NODE_ENV=production` is set during install, npm skips them and `tsc` fails with `TS7016`.

Use one of these:

- Build command: `npm install --include=dev && npm run build`
- Or set `NPM_CONFIG_PRODUCTION=false` for the build, then keep `NODE_ENV=production` at runtime

Start command: `npm start` (`node dist/server.js`).

Health: `GET /` and `GET /health`.

### Runtime environment

Set these on Render. Do not commit real values.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `production` at runtime |
| `PORT` | Render sets this; the server reads `PORT` |
| `MONGO_URL` | MongoDB connection string. If it matches local `.env`, production and local share one database |
| `JWT_SECRET` | Long random string, 32+ characters |
| `CLIENT_URL` | Public site origin, no trailing slash. Example: `https://www.gygi.org` |
| `SOCKET_CORS_ORIGIN` | Extra browser origins, comma-separated. Include `https://www.gygi.org`, `https://gygi.org`, and the Vercel host if you use it |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server-side Gemini only |
| `UPLOADTHING_TOKEN` | Uploads and recordings. Render disk is ephemeral; do not rely on local files |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_SECURE` | Password reset mail |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web push. Generate with `npx web-push generate-vapid-keys` |
| `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | Optional recording pipeline |

`CLIENT_URL` must be the site the browser is on. The API uses it for CORS and for `Secure` + `SameSite=None` cookies.

## Frontend on Vercel

Root directory: `frontend`. Framework: Vite. Build: `npm run build`. Output: `dist`.

These variables are public. Vite only inlines names that start with `VITE_`. In the Vercel UI, leave them as Config, not Sensitive. Sensitive values cannot be switched back to Config after save; delete and recreate them if that happens.

| Variable | Production example |
| --- | --- |
| `VITE_API_BASE_URL` | `https://thegygi-webapp.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://thegygi-webapp.onrender.com` |
| `VITE_SITE_URL` | `https://www.gygi.org` |
| `VITE_APP_ENV` | `production` |
| `VITE_APP_NAME` | `GYGI Platform` |

Do not point `VITE_API_BASE_URL` or `VITE_SOCKET_URL` at `https://www.gygi.org`. That host is the website. The API and sockets stay on Render. Only `VITE_SITE_URL` is the public site.

A Vercel warning that says “remove the public framework prefix” is about the name starting with `VITE_`. These URLs are meant to be in the browser. Do not rename them.

## After deploy

1. Open `https://thegygi-webapp.onrender.com/health` and confirm `environment` is `production`.
2. Sign in on `https://www.gygi.org`. The dashboard should stay signed in. A flash of the dashboard and a bounce to `/login` means the new frontend and API are not both live, or `CLIENT_URL` does not match the site.
3. Confirm the browser is sending `Authorization: Bearer` (sessionStorage key `gygi_access`).

## Local development

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

Frontend: `http://localhost:5173`. API: `http://localhost:5000`.

`npm run build` in `frontend` runs `tsc -b` first. A toast or JSX value that is not a string or element fails the Vercel build even if `vite` itself would have bundled it.

## GitHub

The app remote used in this project is `girlsyouvegotit/thegygi-webapp`. Push with an account that has write access. Do not commit `.env`.
