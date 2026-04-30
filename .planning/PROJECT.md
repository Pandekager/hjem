# Hjem Dashboard

## What This Is

A private, minimal dashboard web app for Rasmus and Anna. Serves as a personal homepage with large clickable visual tiles that link to internal home services (Home Assistant, Nammenam, Jellyfin). No authentication, no database — a pure launcher for local network services.

## Core Value

The family can access all their home services from one place without remembering URLs or IP addresses.

## Requirements

### Validated

- ✓ Apps dashboard page with tile grid — quick task 1
- ✓ Home Assistant tile (links to HA dashboard) — quick task 1
- ✓ Nammenam tile (links to food planner) — quick task 1
- ✓ Jellyfin tile (links to media server) — quick task 1
- ✓ Reusable AppTile component with photo backgrounds — quick task 2
- ✓ Photo backgrounds on tiles (Homeassistant.jpg, Nammenam.jpg, Jellyfin.jpg) — quick task 2
- ✓ Responsive layout (3-col grid on desktop, single-col on mobile) — quick task 1/2
- ✓ Dark overlay gradient for text legibility over photos — quick task 2
- ✓ BMC4 Minecraft server as systemd service — v1.0
- ✓ Start/stop Minecraft server with status display — v1.0
- ✓ Server is off by default (disabled at boot) — v1.0
- ✓ Interactive MC server tile with photo background — v1.0
- ✓ Crash detection + force kill fallback — v1.0

### Active

- (None — all v1.0 requirements shipped)

### Out of Scope

- Authentication / user login — Private family dashboard, only accessible on local network
- Server monitoring / metrics — Status is limited to running/stopped, no CPU, memory, or player tracking
- Multiple Minecraft servers — Just the single BMC4 server
- MC server console / RCON — No in-game command execution from dashboard

## Context

- Built with Nuxt 4 + Vue 3, deployed via Docker on `dilleur` (Tailscale host)
- Current tiles: Home Assistant (100.89.160.17:8123), Nammenam (dilleur:3001), Jellyfin (dilleur:8096), MC Server (interactive)
- BMC4 (Better Minecraft) Forge 1.20.1 modpack server installed at `/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/`
- Server runs as systemd service (`mcserver.service`) with Java 17, 8-10GB RAM, disabled at boot
- D-Bus socket mounted into Docker container for systemd communication via dbus-next
- API routes: GET /api/mc/status, POST /api/mc/start, POST /api/mc/stop, POST /api/mc/kill
- Tile features: state machine (Stoppet → Starter... → Kører → Stopper... → Stoppet), crash detection, force kill after 60s
- 2,059 lines added, 24 files changed across 18 commits

## Constraints

- **Network**: Dashboard runs in Docker with `network_mode: host` — API routes can access systemd on the host
- **Security**: Dashboard accessible only on local LAN / Tailscale network — no auth needed
- **Server path**: Minecraft server directory is at a fixed absolute path on the host filesystem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nuxt server API routes vs separate API | Simpler deployment, single process, already running in host network mode | ✓ Good — 4 endpoints in ~80 LOC |
| systemd service for MC server | Reliable process management, start/stop via systemctl, off-by-default | ✓ Good — HOST-01..HOST-04 satisfied |
| D-Bus socket mount vs SSH/localhost | Docker can mount Unix socket directly, no auth overhead, ~1ms latency | ✓ Good — DOCK-01, DOCK-02 satisfied |
| Separate ServerTile.vue (not modifying AppTile) | Interactive tile is fundamentally different from static link tiles | ✓ Good — clean separation, 320 LOC |
| dbus-next properties via Properties.Get | dbus-next 0.10.2 has no `iface.Get()` — must use `Properties.Get(iface, prop)` | ✓ Good — verified in container |
| `SuccessExitStatus=143` for Java SIGTERM | Java exits with 143 on SIGTERM; without this, stop shows `failed` | ✓ Good — stop shows `inactive (dead)` |

---

---
*Last updated: 2026-04-30 after v1.0 Minecraft Server Tile milestone*
