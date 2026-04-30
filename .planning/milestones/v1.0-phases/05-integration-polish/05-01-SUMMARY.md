---
phase: 05-integration-polish
plan: 01
subsystem: frontend
tags: [polish, crash-detection, force-kill, robustness]
requires: [04-frontend-tile-01]
provides:
  - "Crash detection: tile detects unexpected server stops while page is open"
  - "Force kill: POST /api/mc/kill endpoint + Tving Stop button after 60s timeout"
requirements-completed: [POLISH-01, POLISH-02, POLISH-03]
duration: 10min
completed: 2026-04-30
---

# Phase 05 Integration & Polish: 01-SUMMARY

**Crash detection, force kill, and robustness enhancements for the MC Server tile**

## Accomplishments

- **POLISH-01** (auto-poll after start/stop): Already implemented in Phase 4 fix — polls every 2s until settled or 30s timeout
- **POLISH-02** (crash detection): Background monitor checks every 10s while tile is open. If server goes active → inactive/failed unexpectedly, tile shows "Lukket uventet" with restart option
- **POLISH-03** (stop timeout + force kill): Added `killUnit()` to systemd.ts, POST /api/mc/kill endpoint, and "Tving Stop" button (red, appears if graceful stop exceeds 60s)

## Files Modified

- `server/utils/systemd.ts` — added `killUnit(unitName)` using systemd Unit.Kill with SIGKILL
- `server/api/mc/kill.post.ts` — new endpoint for force kill
- `app/components/ServerTile.vue` — crash detection monitor + force kill UI + stop timeout logic

---

*Phase: 05-integration-polish*
*Plan: 01*
*Completed: 2026-04-30*
