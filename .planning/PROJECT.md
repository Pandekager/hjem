# Hjem Dashboard

## What This Is

A private, minimal dashboard web app for Rasmus and Anna. Serves as a personal homepage with large clickable visual tiles that link to internal home services (Home Assistant, Nammenam, Jellyfin). No authentication, no database — a pure launcher for local network services.

## Core Value

The family can access all their home services from one place without remembering URLs or IP addresses.

## Requirements

### Validated

- ✓ Apps dashboard page with tile grid — Phase 1 / quick task 1
- ✓ Home Assistant tile (links to HA dashboard) — quick task 1
- ✓ Nammenam tile (links to food planner) — quick task 1
- ✓ Jellyfin tile (links to media server) — quick task 1
- ✓ Reusable AppTile component with photo backgrounds — quick task 2
- ✓ Photo backgrounds on tiles (Homeassistant.jpg, Nammenam.jpg, Jellyfin.jpg) — quick task 2
- ✓ Responsive layout (3-col grid on desktop, single-col on mobile) — quick task 1/2
- ✓ Dark overlay gradient for text legibility over photos — quick task 2

### Active

- [ ] User can start the BMC4 Minecraft server from the dashboard
- [ ] User can stop the BMC4 Minecraft server from the dashboard
- [ ] User can see the current running/stopped status of the Minecraft server
- [ ] Minecraft server is managed as a systemd service (created if missing)
- [ ] Minecraft server is off by default (not running on boot)

### Out of Scope

- Authentication / user login — Private family dashboard, only accessible on local network
- Server monitoring / metrics — Status is limited to running/stopped, no CPU, memory, or player tracking
- Multiple Minecraft servers — Just the single BMC4 server
- Docker management — Server runs as systemd service, not in Docker
- MC server console / RCON — No in-game command execution from dashboard

## Context

- Built with Nuxt 4 + Vue 3, deployed via Docker on `dilleur` (Tailscale host)
- Current tiles: Home Assistant (192.168.0.246:8123), Nammenam (dilleur:3001), Jellyfin (dilleur:8096)
- BMC4 (Better Minecraft) Forge 1.20.1 modpack server installed at `/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/`
- Server uses Java 17 with 8-10GB RAM allocation
- No systemd service currently exists — server is started manually
- Dashboard currently has NO server-side code; this milestone adds the first Nuxt server API routes

## Constraints

- **Network**: Dashboard runs in Docker with `network_mode: host` — API routes can access systemd on the host
- **Security**: Dashboard accessible only on local LAN / Tailscale network — no auth needed
- **Server path**: Minecraft server directory is at a fixed absolute path on the host filesystem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Nuxt server API routes vs separate API | Simpler deployment, single process, already running in host network mode | — Pending |
| systemd service for MC server | Reliable process management, start/stop via systemctl, can be off-by-default | — Pending |

---

## Current Milestone: v1.0 Minecraft Server Tile

**Goal:** Add an interactive Minecraft server tile that lets users start/stop the BMC4 Forge server and see its status.

**Target features:**
- Create systemd service for the BMC4 Forge 1.20.1 server
- Add Nuxt server API routes (status, start, stop)
- Interactive tile with status indicator and start/stop button
- Background image for the Minecraft tile

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after v1.0 milestone start*
