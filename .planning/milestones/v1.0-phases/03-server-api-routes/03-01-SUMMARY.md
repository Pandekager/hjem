---
phase: 03-server-api-routes
plan: 01
subsystem: api
tags: [nuxt, dbus, systemd, api, rate-limiting]
requires: [02-docker-integration-01]
provides:
  - "GET /api/mc/status returns systemd unit ActiveState"
  - "POST /api/mc/start calls StartUnit('replace')"
  - "POST /api/mc/stop calls StopUnit('replace')"
  - "409 conflict responses for invalid actions"
  - "Origin check + rate limiting (30 req/min/IP)"
affects: [04-frontend-tile]
tech-stack:
  added: dbus-next integration pattern via org.freedesktop.DBus.Properties.Get
  patterns: Nuxt 4 server routes with method-suffixed file naming, middleware security
key-files:
  created:
    - server/utils/systemd.ts
    - server/api/mc/status.get.ts
    - server/api/mc/start.post.ts
    - server/api/mc/stop.post.ts
    - server/middleware/mc-security.ts
  modified:
    - .planning/phases/03-server-api-routes/03-01-PLAN.md
requirements-completed: [API-01, API-02, API-03, API-04, API-05, API-06]
duration: 25min
completed: 2026-04-30
---

# Phase 03 Server API Routes: 01-SUMMARY

**Nuxt server API routes that communicate with host systemd via D-Bus to control the Minecraft server**

## Performance

- **Started:** 2026-04-30T12:20:00Z
- **Completed:** 2026-04-30T12:45:00Z
- **Tasks:** 4 (3 automated, 1 human-verify)
- **Files created:** 5

## Accomplishments

- Created `server/utils/systemd.ts` with cached D-Bus connection and thin wrappers for systemd operations
- Created `server/api/mc/status.get.ts` — returns `{ state }` from unit's ActiveState property
- Created `server/api/mc/start.post.ts` — validates state, calls StartUnit, returns 409 if already active
- Created `server/api/mc/stop.post.ts` — validates state, calls StopUnit, returns 409 if already inactive
- Created `server/middleware/mc-security.ts` — origin check (403 on mismatch) + in-memory rate limiting (30 req/min/IP)
- Verified all 3 endpoints with curl: status, start, stop, 409 conflicts, origin check

## Deviations from Plan

### Auto-fixed Issues

**1. [Research assumption] dbus-next uses Properties.Get not interface.Get for property access**
- **Issue:** Plan assumed `unitIface.Get(iface, prop)` works. dbus-next 0.10.2 has no `Get()` on interface proxies. Properties must be fetched via `org.freedesktop.DBus.Properties.Get(iface, prop)`.
- **Fix:** Changed `getUnitState` to use the Properties interface's Get method, returning `activeState.value`.
- **Verification:** Status correctly returns `{"state": "active"}` when server is running.

**2. [Build issue] Import path resolution with Nuxt 4 app directory**
- **Issue:** `~/server/utils/systemd` resolved as `/app/app/server/utils/systemd` (double `app/`) because `~` maps to srcDir which auto-detects the `app/` directory.
- **Fix:** Changed imports to relative paths (`../../utils/systemd`).
- **Verification:** Build succeeds, all routes accessible at runtime.

## Verification Results

| Step | Endpoint | Expected | Actual | Result |
|------|----------|----------|--------|--------|
| 1 | GET /api/mc/status | inactive/not-found | `{"state":"not-found"}` | ✅ |
| 2 | POST /api/mc/start | `{"success":true}` | `{"success":true}` | ✅ |
| 3 | GET /api/mc/status | active | `{"state":"active"}` | ✅ |
| 4 | POST /api/mc/start (double) | 409 | 409 | ✅ |
| 5 | POST /api/mc/stop | `{"success":true}` | `{"success":true}` | ✅ |
| 6 | GET /api/mc/status | inactive/not-found | `{"state":"not-found"}` | ✅ |
| 7 | POST /api/mc/stop (double) | 409 | 409 | ✅ |
| 8 | Origin: evil.com | 403 | 403 | ✅ |
| 9 | systemctl is-enabled | disabled | disabled | ✅ |

## Frontend Notes

- **not-found state:** When the server is stopped, the API returns `{"state":"not-found"}` rather than `{"state":"inactive"}`. This is because systemd unloads disabled units after their process exits — `GetUnit()` raises an error, caught as `not-found`. The Phase 4 tile should treat `not-found` the same as `inactive`.
- **Error handling:** Start returns 409 if already active/activating. Stop returns 409 if inactive/dead/not-found.

## Next Phase Readiness

- **Phase 4 (Frontend Tile)** can proceed: all API endpoints are verified and functional.
- The tile needs to poll GET /api/mc/status and display start/stop buttons.
- Watch for the `not-found` edge case — must be handled as "stopped" state.

---

*Phase: 03-server-api-routes*
*Plan: 01*
*Completed: 2026-04-30*
