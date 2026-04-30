---
phase: 01-host-setup
plan: 01
subsystem: infra
tags: [systemd, minecraft, forge, java, systemctl, service-file]
requires: []
provides:
  - "Systemd unit for BMC4 Forge 1.20.1 server at /etc/systemd/system/mcserver.service"
  - "Verified Java 17 + Forge unix_args.txt arguments from host filesystem"
  - "Off-by-default boot behavior (service disabled, HOST-02 satisfied)"
  - "Manual start/stop/status control verified (HOST-03, HOST-04 satisfied)"
affects: [02-docker-integration, 03-server-api, 04-frontend-tile]
tech-stack:
  added: systemd unit configuration with Java SIGTERM exit code handling
  patterns: systemd service file management with SuccessExitStatus for Java processes
key-files:
  created:
    - /etc/systemd/system/mcserver.service
    - .planning/services/mcserver.service
  modified:
    - .planning/STATE.md
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
key-decisions:
  - "Added SuccessExitStatus=143 to handle Java's SIGTERM exit code (143 = 128 + 15). Without it, `systemctl stop mcserver` shows `failed` instead of `inactive (dead)`"
  - "Service uses `Type=simple` with `KillMode=process` — Java process runs in foreground, systemd tracks PID and kills the full process tree on stop"
requirements-completed: [HOST-01, HOST-02, HOST-03, HOST-04]
duration: 30min
completed: 2026-04-30
---

# Phase 01 Host Setup: 01-SUMMARY

**Systemd service for BMC4 Forge 1.20.1 Minecraft server with verified start/stop/status control, disabled at boot per HOST-02**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-30T09:20:00Z
- **Completed:** 2026-04-30T11:30:00Z
- **Tasks:** 2 (1 automated, 1 human-verify)
- **Files modified:** 4 (plus 2 service files on host)

## Accomplishments

- Created systemd unit at `/etc/systemd/system/mcserver.service` with correct Java 17 OpenJDK path and Forge unix_args.txt arguments — verified from disk (HOST-01)
- Registered service via `sudo systemctl daemon-reload` and disabled at boot — `systemctl is-enabled mcserver` confirms `disabled` (HOST-02)
- Manually verified server starts (`systemctl start mcserver` → `active (running)`), Java process visible in `ps aux`, and stops cleanly (`systemctl stop mcserver` → `inactive (dead)`, no Java process remaining) — HOST-03 and HOST-04 satisfied
- Stored reference copy at `.planning/services/mcserver.service` matching the deployed file exactly

## Task Commits

Note: Automated task execution and human verification completed as a single phase run. Changes are committed together with this summary.

1. **task 1: Create systemd service file + daemon-reload + disable + reference copy** — Automated, included in final commit
2. **task 2: Manually verify start, status, and stop** — Approved by human operator

**Plan metadata:** Final commit

## Files Created/Modified

- `/etc/systemd/system/mcserver.service` — Deployed systemd unit on host (created)
- `.planning/services/mcserver.service` — Reference copy in project (modified: added `SuccessExitStatus=143`)
- `.planning/phases/01-host-setup/01-01-PLAN.md` — Plan document (moved from old path for consistent naming)
- `.planning/STATE.md` — Updated to reflect plan completion
- `.planning/ROADMAP.md` — Phase 1 plan 01 marked complete
- `.planning/REQUIREMENTS.md` — HOST-01 through HOST-04 marked complete

## Decisions Made

- **SuccessExitStatus=143 for Java SIGTERM handling:** Added to the service file beyond what the plan specified. Java exits with code 143 (128 + 15 for SIGTERM). Without `SuccessExitStatus=143`, systemd treats this as a failure and reports `Active: failed` after `systemctl stop`, which would cause the future status API to show "failed" instead of "stopped" on normal shutdown.
- **Service stays disabled at boot:** `systemctl disable mcserver` confirmed — the 8-10GB RAM server only starts when explicitly requested.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added SuccessExitStatus=143 for clean stop semantics**
- **Found during:** task 1 (Service file creation)
- **Issue:** Plan's original service template did not include `SuccessExitStatus=143`. Java exits with code 143 (128 + SIGTERM=15) when systemd sends SIGTERM on stop. Without this directive, systemd reports `Active: failed` after a normal `systemctl stop`.
- **Fix:** Added `SuccessExitStatus=143` to the `[Service]` section of both the host file and reference copy
- **Files modified:** `.planning/services/mcserver.service`, `/etc/systemd/system/mcserver.service`
- **Verification:** After `sudo systemctl stop mcserver`, `systemctl status mcserver` shows `Active: inactive (dead)` instead of `Active: failed`
- **Committed in:** Final commit

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary for correct systemd stop semantics. Without this fix, Phase 3's status API would report "failed" after every normal shutdown instead of "stopped", breaking the tile UX. No scope creep.

## Issues Encountered

None — execution proceeded smoothly. The `SuccessExitStatus=143` requirement was identified during service file creation and handled immediately.

## User Setup Required

None — no external service configuration required. The systemd service is ready on the host.

## Next Phase Readiness

- **Phase 2 (Docker Integration)** can proceed: the systemd service exists and is verifiable.
- Next step: mount the host D-Bus socket (`/run/dbus/system_bus_socket`) into the Docker container and install the `dbus-next` npm package.
- The service file path and Java arguments are now documented and stable — no further host-side changes expected.

---

*Phase: 01-host-setup*
*Plan: 01*
*Completed: 2026-04-30*
