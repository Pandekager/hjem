# Feature Research

**Domain:** Minecraft server control tile (Nuxt 4 dashboard)
**Researched:** 2026-04-29
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Running/Stopped status indicator** | Primary purpose — user needs to know if server is up | LOW | Two states + two transitional (starting/stopping). Poll on page load + after actions. |
| **Start button** | Only reason to have a control tile | LOW | Disabled when server is running or transitioning. Triggers POST to start API. |
| **Stop button** | Basic server control | LOW | Disabled when server is stopped or transitioning. Triggers POST to stop API. |
| **Server name + description** | Consistency with existing tiles | LOW | "BMC4 Minecraft" / "Better MC [FORGE] 1.20.1 server" or similar. Follows existing AppTile pattern. |
| **Visual consistency with other tiles** | Dashboard should feel cohesive | MEDIUM | Same card dimensions, photo background, overlay gradient, glow effect as AppTile. But component is interactive not a link. |
| **Error feedback** | User must know if action failed | MEDIUM | Toast/banner showing "Failed to start" / "Failed to stop". Must not silently fail. |
| **Disabled state during transitions** | Prevent double-clicks and race conditions | LOW | Buttons disabled while "starting" or "stopping". Status shows transitional state. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Transitional UI states (starting/stopping)** | Instant visual feedback that an action was received | LOW | Encode states beyond binary: `idle`, `starting`, `running`, `stopping`, `stopped`, `error`. Each maps to distinct UI. |
| **Auto-poll status after action** | No manual refresh needed to see new state | LOW | Poll `/api/minecraft/status` every 2s for up to 30s after start/stop, then settle. |
| **Graceful stop with timeout** | Server saves world before shutdown | LOW | `systemctl stop` sends SIGTERM → Minecraft saves & shuts down. No hard kill in normal flow. |
| **Status on page load** | Always shows current state when dashboard opens | LOW | Fetch status in `onMounted` or via `useFetch`. |
| **Server background photo tile** | Matches visual style of HA/Nammenam/Jellyfin tiles | LOW | Add Minecraft-themed background image to tile. |
| **systemd service created if missing** | Frictionless first-time setup | MEDIUM | API route attempts to create service file if it doesn't exist. Or: created during deploy/install. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **RCON console / in-game commands** | "Would be cool to run commands from dashboard" | RCON needs separate port, auth. Complex state handling. Goes against project scope. | Out of scope per PROJECT.md. If needed later: separate page, not the tile. |
| **Online player list** | Common server dashboard feature | Requires querying server status (protocol), maintaining connection, adds complexity. | Out of scope. This tile is start/stop/status only. |
| **Server metrics (CPU/RAM/TPS)** | Monitoring enthusiasts want data | System metrics need additional tooling. MC TPS needs RCON or API plugin. | Out of scope. Status is just running/stopped. |
| **Auto-start on dashboard page load** | "Don't want to click start every time" | Server is intentionally off-by-default (8-10GB RAM). Auto-start would waste resources. | Leave off by default as specified. |
| **Real-time server logs / terminal** | Debugging server crashes | log tailing needs WebSocket or SSE. Overkill for a dashboard tile. | If needed: SSH access for debugging, not dashboard. |
| **Restart button** | Common convenience | With off-by-default policy, restart is just stop+start. Adds button clutter. | User can stop then start. |
| **Multiple Minecraft servers** | "What if I add more servers?" | Adds selection UI, per-server state, more complex API routing. | Out of scope per PROJECT.md. Single BMC4 server only. |

## Feature Dependencies

```
Interactive MC Tile (component)
    └──requires──> Nuxt Server API routes
                       ├──requires──> GET /api/minecraft/status
                       ├──requires──> POST /api/minecraft/start
                       └──requires──> POST /api/minecraft/stop
                            └──requires──> systemd service exists on host
                                └──requires──> Docker can execute systemctl on host

Status display
    └──enhances──> Existing AppTile component (needs modification or new component)

Polling after action
    └──requires──> Status API endpoint
    └──enhances──> Start/Stop button UX
```

### Dependency Notes

- **Interactive tile requires API routes:** The tile cannot be a static link like existing tiles. It needs to call server endpoints and handle responses.
- **systemd service is foundational:** All three API routes depend on the service file existing. If the service doesn't exist, start/stop/status all fail.
- **AppTile component needs modification:** The existing AppTile renders an `<a>` tag. The MC tile is interactive (button clicks, not navigation). Either:
  - (a) Refactor AppTile to support both `url` (link) and `action` (interactive) modes — cleaner but changes existing code
  - (b) Create a separate McTile.vue component — simpler but duplicates styling

## State Machine

The Minecraft server tile has a well-defined state machine governing both the backend and frontend:

```
             ┌──────────────────────────────────────────────┐
             │                                              │
             ▼                                              │
       ┌──────────┐  start()   ┌───────────┐  timeout/     │
       │  STOPPED  │ ────────▶  │ STARTING  │  fail         │
       │           │            │           │ ──────────▶   │
       └──────────┘            └───────────┘               │
             ▲                                               │
             │                                               │
       ┌──────────┐  stop()    ┌───────────┐               │
       │ RUNNING  │ ◀────────  │  STOPPING │               │
       │          │            │           │               │
       └──────────┘            └───────────┘               │
             ▲                                              │
             │                                              │
       ┌──────────┐   error                                │
       │  ERROR   │ ────────────────────────────────────────┘
       │          │   (any action can transition to ERROR)
       └──────────┘
```

**Transitions:**
- `STOPPED → STARTING`: User clicks Start
- `STARTING → RUNNING`: systemd confirms process is active (poll successful)
- `STARTING → ERROR`: Start fails (timeout, service not found, systemctl error)
- `RUNNING → STOPPING`: User clicks Stop
- `STOPPING → STOPPED`: systemd confirms process stopped
- `STOPPING → ERROR`: Stop fails (timeout, systemctl error)
- `ERROR → STOPPED`: User clicks Retry (re-checks status)
- `RUNNING → ERROR`: Server crashes (detected by status poll showing inactive unexpectedly)

**Frontend status indicators:**
| Status | Dot Color | Button State | Button Text | Description |
|--------|-----------|--------------|-------------|-------------|
| `stopped` | 🔴 Red | Enabled | Start Server | Server is off |
| `running` | 🟢 Green | Enabled | Stop Server | Server is on |
| `starting` | 🟡 Yellow / Pulse | Disabled | Starting... | Server is booting |
| `stopping` | 🟠 Orange / Pulse | Disabled | Stopping... | Server is shutting down |
| `error` | ⚫ Gray / ⚠️ | Enabled | Retry | Something went wrong |

## Error Scenarios

### Complete Error Matrix

| Scenario | API Response | Frontend Handling |
|----------|-------------|-------------------|
| Server already running when Start clicked | 409 Conflict `{ status: 'running', message: 'Server is already running' }` | Show status as running. No error toast — it's expected state. |
| Server already stopped when Stop clicked | 409 Conflict `{ status: 'stopped', message: 'Server is already stopped' }` | Show status as stopped. No error toast — expected state. |
| systemd service doesn't exist | 500 `{ error: 'Service not found', details: 'mcserver.service does not exist' }` | Show error banner: "Server service not configured. Contact admin." |
| Start fails (systemctl returns error) | 500 `{ error: 'Failed to start', details: '...' }` | Toast "Failed to start server." Show error with retry option. |
| Stop fails (systemctl returns error) | 500 `{ error: 'Failed to stop', details: '...' }` | Toast "Failed to stop server." Show error with retry option. |
| Start timeout (>30s to reach running) | Frontend detected (poll timeout) | Show "Could not confirm server started." Offer retry. Status stays as polled. |
| Stop timeout (>30s to reach stopped) | Frontend detected (poll timeout) | Show "Could not confirm server stopped." Offer retry and force kill option. |
| systemctl permission denied | 500 `{ error: 'Permission denied' }` | Error toast "Permission denied. Server cannot be controlled." |
| Network error / API down | Fetch throws | Show "Connection lost" state. Disable buttons. Auto-recover when API returns. |
| Unexpected status response | 500 / malformed | Show generic error. Log details for debugging. |

### Error Recovery Flow

```
1. User clicks Start
2. Show "starting..." state (buttons disabled)
3. POST /api/minecraft/start  
4a. HTTP 200 → Start polling status every 2s
    - status === "running" → show green, enable Stop button
    - status === "stopped" after 30s → show error "Server didn't start"
4b. HTTP 409 → Server was already running. Just show running state. (idempotent)
4c. HTTP 500 → Error state. Show error message with Retry button.
```

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Status indicator (running/stopped)** — core purpose of the tile
- [x] **Start button** — triggers server start via API
- [x] **Stop button** — triggers server stop via API
- [x] **Server name + description** — consistency with other tiles
- [x] **Background image tile** — visual consistency with HA/Nammenam/Jellyfin
- [x] **Transitional states (starting/stopping)** — prevents double-clicks, gives feedback
- [x] **Error feedback on action failure** — user knows when something went wrong
- [x] **Auto-refresh status on page load** — shows current state when dashboard opens

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Polling after start/stop** — auto-confirm state change instead of requiring manual refresh
- [ ] **systemd service auto-creation** — API route creates service if missing (or: setup script)
- [ ] **Server crash detection** — detect unexpected status changes via periodic polling while page is open
- [ ] **Stop timeout + force kill fallback** — if graceful stop hangs, offer hard kill option

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Restart button** — convenience (currently: stop then start)
- [ ] **Console output snippet** — last N lines of server log in expansion area
- [ ] **Player count** — query server via status protocol, show if anyone is online
- [ ] **Scheduled start/stop** — start server at specific times
- [ ] **Server version info** — show forge version, mod count, etc.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Status indicator | HIGH | LOW | P1 |
| Start button | HIGH | LOW | P1 |
| Stop button | HIGH | LOW | P1 |
| Error feedback | HIGH | LOW | P1 |
| Transitional states | HIGH | LOW | P1 |
| Background image tile | MEDIUM | LOW | P1 |
| Auto-refresh on page load | MEDIUM | LOW | P1 |
| Polling after action | MEDIUM | MEDIUM | P2 |
| Crash detection | MEDIUM | MEDIUM | P2 |
| Stop timeout + force kill | LOW | MEDIUM | P2 |
| systemd auto-creation | LOW | MEDIUM | P2 |
| Restart button | LOW | LOW | P3 |
| Console logs | LOW | HIGH | P3 |
| Player count | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (this milestone)
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Crafty Controller | AMP | Pterodactyl (wings) | Our Approach |
|---------|-------------------|-----|---------------------|--------------|
| Start/Stop | ✅ Dedicated buttons | ✅ Dedicated buttons | ✅ Dedicated buttons | ✅ Single tile with contextual button |
| Status indicator | ✅ Color-coded + text | ✅ Color-coded + text | ✅ Status badges | ✅ Color dot + text label |
| Console/RCON | ✅ Full terminal emulation | ✅ Full terminal | ✅ Full terminal | ❌ Out of scope |
| Player list | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Out of scope |
| Resource monitoring | ✅ CPU/RAM/Disk | ✅ CPU/RAM | ✅ Docker metrics | ❌ Out of scope |
| Service management | ✅ systemd integration | ✅ Custom service | ✅ Docker container | ✅ systemd via host |
| Mobile-friendly | ⚠️ Desktop-first | ⚠️ Desktop-first | ⚠️ Desktop-first | ✅ Mobile-first responsive |
| Visual style | ❌ Functional, dated | ❌ Dense, technical | ❌ Tech admin | ✅ Clean, family dashboard |

## Sources

- [PROJECT.md — Hjem Dashboard requirements](file:///home/rasmus/Work/hjem/.planning/PROJECT.md)
- [Nuxt 4 docs — server API routes](https://nuxt.com/docs/guide/directory-structure/server)
- [H3 error handling patterns](https://h3.dev/examples/validate-data)
- [Crafty Controller](https://craftycontrol.com/) — popular open-source MC server manager (community patterns)
- [AMP](https://cubecoders.com/AMP) — commercial game server management panel (feature reference)
- [Pterodactyl Panel](https://pterodactyl.io/) — open-source game server panel (architecture reference)
- systemd documentation for service unit files and `systemctl` usage
- Existing codebase analysis (AppTile component, Dockerfile, docker-compose.yml)

---

*Feature research for: Minecraft server control tile on Nuxt 4 dashboard*
*Researched: 2026-04-29*
