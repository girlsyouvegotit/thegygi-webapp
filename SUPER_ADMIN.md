# Super Admin Portal

Role: `super_admin` (above `admin`).

## Create the first super-admin

From `backend/`:

```bash
npx tsx src/scripts/promote-super-admin.ts you@email.com
```

Then log in — you’ll land on `/super-admin/dashboard`.

## What’s included

1. **All admin portal features** under `/super-admin/ops/*` (Categories, Users, Mentorship assign, Recordings, Analytics, Finance, Activity Logs, Settings, Profile) — same screens, Super Admin shell.
2. **50 advanced capabilities** (F01–F50) across Growth, People, Trust, Finance, Live Ops, Academics, Content, Workforce, Comms, System, and Support hubs.

## Routes

| Path | Purpose |
|------|---------|
| `/super-admin/dashboard` | Mission control pulse |
| `/super-admin/growth` | Funnel, retention, churn, presence (F09–F13) |
| `/super-admin/admins` | Admin governance + capabilities |
| `/super-admin/people` | People search, CSV, bulk actions, 360, impersonation (F01–F07) |
| `/super-admin/trust` | Blocklists, abuse, sessions, GDPR (F08, F44–F47) |
| `/super-admin/security` | Audit trail |
| `/super-admin/support` | Support tickets + SLA (F48) |
| `/super-admin/finance` | Fee/salary queues, expenses, CSV (F29–F36) |
| `/super-admin/mentorship` | Mentor load graph |
| `/super-admin/workforce` | Fill rates, utilization, conflicts (F23–F26, F37–F38) |
| `/super-admin/academics` | Enrollments, years, certs, quiz/assignment risk (F14–F18) |
| `/super-admin/content` | Recordings + community moderation (F19–F22) |
| `/super-admin/comms` | Blasts + emergency broadcast (F27, F39–F40) |
| `/super-admin/live-ops` | Live rooms + force-end all (F28) |
| `/super-admin/org` | Maintenance, banners, feature flags |
| `/super-admin/system` | Windows, kill-switches, rollouts, changelog, reports (F41–F43, F49–F50) |
| `/super-admin/ops/*` | Full admin feature set |

## API

All under `/api/super-admin/*` (cookie auth + `super_admin` only).

Advanced hubs: `GET /growth|academics|content|workforce|trust|system|support` plus mutation routes for people, finance, comms, content, live-ops, support, and system.

## Moderation

`/super-admin/moderation` — warn, official message, suspend/unsuspend, ban/unban.

APIs under `/api/super-admin/moderation/*`. Banned emails cannot re-register; suspended/banned users get clear login errors. All actions are audited.

## Notes

- Super-admins can also open the regular `/admin/*` portal.
- Impersonation is **read-only** (session watermark + exit banner).
- Dangerous mutations write `isAudit: true` activity logs.
- Session revoke uses `sessionsRevokedAt` checked in auth middleware.
