# HTTP API

Base URL in production: `https://thegygi-webapp.onrender.com`.

All routes below are prefixed with `/api` except the health checks.

## Conventions

- JSON bodies. Cookie parser is enabled. Send `Authorization: Bearer <accessToken>` from the browser. The login response includes `data.accessToken`. An httpOnly JWT cookie is also set.
- Success: `{ "success": true, "message": "…", "data": … }`.
- Failure: `{ "success": false, "message": "…" }` with 4xx or 5xx.
- `protect` means a valid user. `adminOnly` means `admin` or `super_admin`. `superAdminOnly` means only `super_admin`.
- Rate limits: login and register (`authRateLimit`), and a general limiter on `/api`.

## Health

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | Public. API name, version, uptime, `environment` |
| GET | `/health` | Public. Memory and CPU as well |

## Auth — `/api/auth`

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/register` | Public | Body: `name`, `email`, `password` (min 6), optional `categoryId`. Role is always student |
| POST | `/login` | Public | Body: `email`, `password`. Returns user and `accessToken` |
| POST | `/forgot-password` | Public | Body: `email` |
| POST | `/reset-password/:token` | Public | Body: new password |
| GET | `/me` | User | Current user |
| POST | `/logout` | User | Clears session |
| POST | `/stop-impersonation` | User | Ends act-as and returns the real user’s access token |

## Users — `/api/users`

Every route requires a user. List, role changes, suspend, and delete require an admin.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/profile` | Own profile |
| PUT | `/profile` | Update profile |
| PUT | `/profile/avatar` | Avatar URL |
| PUT | `/profile/cover` | Cover URL |
| PUT | `/profile/password` | Change own password |
| PUT | `/profile/chat-theme` | Community chat theme |
| PUT | `/profile/chat-wallpaper` | Community chat wallpaper |
| PUT | `/profile/dashboard-theme` | Dashboard theme id |
| GET | `/profile/:id` | Public profile |
| GET | `/` | Admin list |
| POST | `/writers` | Admin. Creates a writer. Optional password must be 8–72 characters |
| GET | `/:id` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin. Also detaches category membership and drops active enrollments |
| PUT | `/:id/suspend` | Admin. Sets inactive and detaches membership |
| PUT | `/:id/activate` | Admin |
| PUT | `/:id/password` | Admin reset. Optional password is 8–72 characters |
| PUT | `/:id/role` | Admin. Changes the user’s role |

## Categories — `/api/categories`

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/` | Public list of active categories. Includes recomputed `studentCount`, `tutorCount`, `mentorCount` |
| GET | `/:id` | User |
| POST | `/` | Admin |
| PUT | `/:id` | Admin |
| DELETE | `/:id` | Admin |
| POST | `/:id/assign-tutor` | Admin. Body includes `tutorId` |
| POST | `/:id/assign-mentor` | Admin. Body includes `mentorId` and optional `maxMentees` |
| DELETE | `/:id/remove-tutor/:tutorId` | Admin |
| DELETE | `/:id/remove-mentor/:mentorId` | Admin |
| POST | `/:id/enroll` | User enrolls |
| GET | `/:id/enrollments` | Tutor or admin |
| DELETE | `/:id/enroll/:studentId` | Admin drops a student |

## Enrollments — `/api/enrollments`

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/me` | User |
| POST | `/category-change-requests` | User |
| GET | `/category-change-requests/me` | User |
| DELETE | `/category-change-requests/:id` | User cancels |
| GET | `/category-change-requests` | Admin |
| POST | `/category-change-requests/:id/approve` | Admin |
| POST | `/category-change-requests/:id/reject` | Admin |

## Classes — `/api/classes`

All routes require a user. Creating, editing, starting, and ending a class requires a tutor or admin. Joining requires any signed-in user.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/upcoming` | Upcoming classes |
| GET | `/` | List |
| POST | `/` | Create |
| GET | `/:id` | One class |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |
| POST | `/:id/schedule` | Schedule |
| PUT | `/:id/reschedule` | Body: `scheduledDate`, optional `duration` (15–300 minutes) |
| PUT | `/:id/cancel` | Cancel |
| GET | `/:id/recordings` | Recordings for the class |
| POST | `/:id/start` | Start the live session |
| POST | `/:id/end` | End it |
| POST | `/:id/recording/upload` | Raw binary upload, up to 200 MB |
| POST | `/:id/recording` | Attach recording metadata |
| POST | `/:id/join` | Join |
| POST | `/:id/leave` | Leave |
| GET | `/:id/session` | Current session |

## Recordings — `/api/recordings`

All routes require a user. Playback routes also check that the caller may access that recording.

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/` | List |
| GET | `/:id/download` | Download. Extra download permission |
| GET | `/:id/search` | Search transcript |
| GET | `/:id/transcript` | Transcript |
| GET | `/:id/chat` | Class chat saved with the recording |
| GET | `/:id/play` | Playback URL |
| GET | `/:id/stream` | Stream |
| GET | `/:id` | One recording |
| DELETE | `/:id` | Admin |

## Quizzes — `/api/quizzes`

All routes require a user.

`POST /` create (tutor or admin), `PUT /:id`, `DELETE /:id`, `GET /`, `GET /category/:categoryId`, `GET /:id`, `POST /:id/submit` (student), `POST /:id/launch` (live quiz), `GET /:id/result` (student), `GET /:id/results` (tutor or admin), `GET /student/:studentId/results`.

## Assignments — `/api/assignments`

All routes require a user.

| Method | Path | Who |
| --- | --- | --- |
| POST | `/` | Tutor or admin creates |
| GET | `/` | Any user |
| GET | `/category/:categoryId` | Any user |
| GET | `/:id` | Any user |
| PUT | `/:id` | Tutor or admin |
| DELETE | `/:id` | Tutor or admin |
| GET | `/:id/my-submission` | Student |
| POST | `/:id/submit` | Student |
| GET | `/:id/submissions` | Tutor or admin |
| POST | `/submissions/:submissionId/grade` | Tutor or admin |
| GET | `/submissions/:submissionId` | Tutor or admin |

## Attendance — `/api/attendance`

`GET /class/:classId` tutor or admin. `GET /student/:studentId` and `GET /summary/:studentId` any user. `POST /` mark attendance (tutor or admin).

## Mentorship — `/api/mentorship`

Requires a user.

Assignments (admin): `GET /assignments`, `GET /assignments/options`, `POST /assignments`, `PUT /assignments/:id`, `DELETE /assignments/:id`, `POST /assignments/assign-mentee`, `DELETE /assignments/mentee`.

Student: `GET /my-mentor`. Mentor: `GET /my-mentees`.

Sessions (mentor creates and updates): `POST /sessions`, `GET /sessions/my`, `GET /sessions/:id`, `PUT /sessions/:id`, `DELETE /sessions/:id/cancel`, `POST /sessions/:id/complete`.

Mentor lists: `GET /goals`, `GET /feedback`, `GET /notes`. Create with `POST /goals`, `POST /feedback`, `POST /notes`. Per mentee: `GET /goals/mentee/:menteeId`, `GET /feedback/mentee/:menteeId`, `GET /notes/mentee/:menteeId`. Update and delete by id. Milestones: `POST /goals/:id/milestones`, `PUT /milestones/:id`.

## Communities — `/api/communities`

Requires a user.

`GET /quick-replies`, `GET /category/:categoryId`, `GET /:communityId/members`, `GET /:communityId/announcements`.

Channel messages: list, send, mark read. Message actions: delete, pin, star, react, report, reply in private, forward. `POST /:communityId/dms` opens a direct message.

## Finance — `/api/finance`

Every route requires an admin.

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/clear` | Body `{ "section": "fees" \| "expenses" \| "salaries" \| "all" }`. Deletes those documents only. Activity log stores section and count |
| GET, POST | `/fees` | List (query `page`, `limit`) and create |
| PUT, DELETE | `/fees/:id` | Update or delete one fee |
| GET, POST | `/expenses` | List and create |
| PUT, DELETE | `/expenses/:id` | |
| GET, POST | `/salaries` | List and create |
| PUT, DELETE | `/salaries/:id` | |

## Analytics — `/api/analytics`

All routes require a user.

| Method | Path | Who |
| --- | --- | --- |
| GET | `/student/:studentId/progress` | Any signed-in user |
| GET | `/tutor/:tutorId` | Tutor or admin |
| GET | `/tutor/:tutorId/students` | Tutor or admin roster |
| GET | `/mentor/:mentorId` | Any signed-in user |
| GET | `/admin/overview` | Admin platform totals |
| GET | `/admin/students-performance` | Admin student performance |

Student totals on the admin overview count active users with role `student`.

## Activities — `/api/activities`

All routes require a user. `GET /` is any role (admins see platform activity). Admin only: `GET /:id`, `GET /user/:userId`, `GET /resource/:resourceType/:resourceId`.

## Notifications — `/api/notifications`

`GET /`, `PUT /read-all`, `PUT /:id/read`, `GET /prefs`, `PUT /prefs`, `GET /push/vapid-key`, `POST /push/subscribe`, `DELETE /push/subscribe`.

## Certificates — `/api/certificates`

`GET /me`, `GET /:id`, `POST /:id/revoke` (admin).

## Post-program — `/api/post-program`

Student: `GET /status`, `GET /jobs`, `GET /portfolio`, `POST /portfolio` (body: `title`, `url`, optional `notes` and `categoryId`).

Mentor or admin: `GET /portfolio/queue`, `POST /portfolio/:id/review` (body: `status` of `reviewed` or `needs_changes`, and `feedback`).

Admin: `GET /admin/monitor`, `GET /admin/jobs`, `GET /admin/portfolio`, `POST /admin/ensure-channels`.

## Content — `/api/content`

Public: `GET /blog`, `GET /blog/:slug`, `GET /writers`, `GET /about`.

Writer or admin (`writerOnly`): the same paths under `/writer` — dashboard, posts (list, get, create, patch, delete), about (get, put, publish).

## Testimonials — `/api/testimonials`

Student: `GET /mine`, `POST /` submit a story.

Admin: `GET /`, `PATCH /:id`, `DELETE /:id`, `GET /comments`, `PATCH /comments/:id`, `DELETE /comments/:id`.

## Public — `/api/public`

No auth.

`GET /community-pulse`, `POST /inquiries`, `POST /chatbot` (site assistant; uses the server Gemini key when set), `GET /testimonials`, `GET /testimonials/engagement`, `POST /testimonials/:id/like`, `GET /testimonials/:id/comments`, `POST /testimonials/:id/comments`.

## Search — `/api/search`

`GET /?q=` workspace search for the signed-in role.

## Settings — `/api/settings`

Admin. `GET/PUT /school`, `/roles`, `/notifications`, `/security`.

## Academic years — `/api/academic-years`

`GET /` list years.

## Storage — `/api/storage`

Admin only. `GET /download/*filePath` streams a stored file.

## Official messages — `/api/official-messages`

All routes require a user. `GET /` threads, `GET /resolve` find or open a thread, `GET /:id`, `POST /:id/replies` with `{ "message": "…" }`.

## Super admin — `/api/super-admin`

Every route requires `super_admin`.

Overview and people: `GET /overview`, `GET /capabilities`, `GET /people`, `GET /people/export`, `POST /people`, `POST /people/bulk`, `GET /people/:id`.

Person actions: impersonate, force password reset, soft-delete, restore, unlock, override photo lock, revoke sessions, GDPR export, GDPR anonymize.

Admins: `GET /admins`, `PATCH /admins/:id`, `POST /admins`.

Finance queues: `GET /finance`, `GET /treasury/queues`, `PATCH /finance/fees/:id` (`paid`, `pending`, or `overdue`), `PATCH /finance/salaries/:id` (`paid` or `pending`). Mentorship reassignment is `POST /mentorship/reassign`. Org controls are `GET /org` and `PUT /org`.

Mentorship, live ops (`POST /live-ops/rooms/:id/end`, `POST /live-ops/end-all`), security, org controls, growth, academics, content, workforce, trust, system, support.

Moderation: `GET /moderation/overview`, `GET /moderation/targets`, `GET /moderation/users/:id/history`, and `POST` actions for message, warn, suspend, unsuspend, ban, and unban.

Certificates: `POST /certificates/:id/revoke`. Content cleanup and support ticket routes live on this router as well (`/support/tickets`, `/academics/years/:id/activate`, `/system/reports/:key`).

## Uploads and jobs

`/api/uploadthing` is the UploadThing handler. Do not put `protect` on that mount. The client upload is checked inside the UploadThing middleware. Their servers call back without a user cookie.

`/api/inngest` serves Inngest functions (recording pipeline) when `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set.

## Sockets

Socket.IO is on the same origin as the API, not under `/api`. The client connects to `VITE_SOCKET_URL` and sends `auth.token` from `gygi_access`. CORS uses the same allow-list as HTTP.
