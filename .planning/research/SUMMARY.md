# Project Research Summary

**Project:** Hjem Dashboard — Minecraft Server Tile
**Domain:** Private family dashboard with Nuxt 4 server API routes + systemd D-Bus integration
**Researched:** 2026-04-29
**Confidence:** HIGH

## Executive Summary

This milestone adds an interactive Minecraft server control tile to an existing Nuxt 4 private dashboard. The tile lets family members start/stop the BMC4 Forge 1.20.1 server and see its current status — all from the same dashboard that already links to Home Assistant, Nammenam, and Jellyfin. The server runs as a systemd service on the host (off by default, consuming 8-10GB RAM only when started), and the dashboard communicates with systemd via the D-Bus protocol through a mounted Unix socket. This is the dashboard's first server-side code — previously it was a purely static SPA.

The recommended approach is clear and well-supported: mount the host's `/run/dbus/system_bus_socket` into the Docker container, use the `dbus-next` npm package (pure JavaScript, zero native dependencies) for Nuxt server API routes to call systemd's `org.freedesktop.systemd1.Manager` interface for StartUnit, StopUnit, and GetUnit/Properties operations. Create a separate `ServerTile.vue` component (not modifying the existing `AppTile.vue`) that implements a finite state machine with 5-6 status states and polls the API after actions. The systemd service file uses `Type=simple`, `User=rasmus`, `KillMode=process`, and calls Java directly with the existing arguments.

Key risks: (1) forgetting to mount the D-Bus socket (container can't reach host systemd — all endpoints fail), (2) race conditions from rapid start/stop clicks (mitigated by frontend guards and systemd's job-replacement mode), (3) D-Bus authentication failing if container doesn't run as root, (4) the D-Bus connection not being cached (file descriptor leak). All are fully preventable with clear mitigations documented in the research.

## Key Findings

### Recommended Stack

The stack is minimal — one new npm dependency and one Docker volume mount. The existing Nuxt 4 + Vue 3 + Bun + Alpine base is unchanged.

**New dependency:**
- **dbus-next 0.10.2**: Pure JavaScript D-Bus client. Connects to the mounted `/run/dbus/system_bus_socket` using Node.js `net` module. No native compilation, works on Alpine, 119 transitive deps. Pinned to exact version.

**Docker changes (docker-compose.yml only):**
- Mount `/run/dbus/system_bus_socket:/run/dbus/system_bus_socket`
- Dockerfile is UNCHANGED — no Alpine packages needed, no systemd binary mounts.

**Host changes (one-time setup):**
- systemd unit file at `/etc/systemd/system/mcserver.service`
- `systemctl daemon-reload` + `systemctl disable mcserver` (off by default)

**Integration decision — D-Bus socket mount (recommended over alternatives):**
- **Rejected: SSH-to-localhost** — too many moving parts (key gen, authorized_keys, host key verification), higher latency (~20-50ms vs ~1ms), fragile.
- **Rejected: dbus-send shell commands** — fragile output parsing of D-Bus introspection format.
- **Valid alternative: Debian base + systemctl** — valid if image size (+156MB) not a concern, but Alpine + dbus-next is lighter and cleaner.

### Expected Features

Based on feature research, competitive analysis (Crafty Controller, AMP, Pterodactyl), and project requirements:

**Must have (P1 — this milestone):**
- Status indicator (running/stopped with color-coded dot) — core purpose
- Start button — disabled when running or transitioning
- Stop button — disabled when stopped or transitioning
- Server name + description — consistency with existing AppTile pattern
- Background image tile — visual consistency with HA/Nammenam/Jellyfin tiles
- Transitional states (starting/stopping) — prevents double-clicks, gives instant feedback
- Error feedback on action failure — toast/banner when API returns error
- Auto-refresh status on page load — shows current state when dashboard opens

**Should have (P2 — add after core is working):**
- Polling after start/stop (every 2s for up to 30s, then settle)
- Server crash detection (poll detects unexpected `inactive` while page is open)
- Stop timeout + force kill fallback (if graceful stop hangs beyond 60s)

**Defer (v2+):**
- Restart button (stop then start is sufficient)
- Console output snippet
- Player count
- Scheduled start/stop
- Multiple servers
- RCON / in-game commands

**Anti-features (avoid):**
- RCON console — out of scope per PROJECT.md, adds auth/complexity
- Online player list — requires server protocol query, not needed for start/stop/status
- Server metrics (CPU/RAM/TPS) — out of scope
- Auto-start on page load — server is off-by-default for 8-10GB RAM savings

### Architecture Approach

The architecture follows a clean three-layer pattern: **Client (ServerTile.vue) → Server API routes (server/api/mc/) → D-Bus utility layer (server/utils/systemd.ts)**. The key architectural insight is that the interactive MC tile is fundamentally different from existing static-link tiles, so a separate `ServerTile.vue` component avoids complicating the existing `AppTile.vue` with conditional branches. No global state management is needed — the tile is self-contained with local reactive state (`serverState`, `error`, `actionInProgress`).

**Major components:**
1. **server/utils/systemd.ts** — Shared dbus-next wrapper. Caches the D-Bus connection at module level. Exports `getUnitState()`, `startUnit()`, `stopUnit()`. This is the only file that knows about D-Bus — swap it out to change integration strategy.
2. **server/api/mc/status.get.ts** — Returns `{ state: "active" | "inactive" | "activating" | "deactivating" | "failed" | "not-found" }` by calling `getUnitState('mcserver.service')`.
3. **server/api/mc/start.post.ts** — Calls `startUnit('mcserver.service', 'replace')`. Returns `{ success: true }` immediately (systemd is async).
4. **server/api/mc/stop.post.ts** — Calls `stopUnit('mcserver.service', 'replace')`. Same async pattern.
5. **ServerTile.vue** — New interactive component. Implements finite state machine: `idle → loading → idle|error → busy(start|stop) → polling → idle|error`. Uses `useFetch` for API calls. Polls status after action with interval cleanup on unmount.
6. **mcserver.service** (on host) — systemd unit file. `Type=simple`, `User=rasmus`, `KillMode=process`, `TimeoutStartSec=120`, `TimeoutStopSec=60`, `Restart=on-failure`. Disabled at boot.

**Key patterns:**
- **Thin API handlers**: Each route is 3-5 lines, calling the shared utility. Keeps HTTP and D-Bus concerns separate.
- **Optimistic + polling status**: After start/stop, immediately update UI to transitional state, then poll every 2s until settled.
- **No global state**: Component-local reactive state only. Extract `useServerControl()` composable if more service tiles are added later.
- **No auth**: Private LAN (Tailscale). Origin check + rate limiting as lightweight security.

### Critical Pitfalls

**Critical (must prevent):**

1. **Container can't reach host systemd** — The most common failure. `network_mode: host` only shares network namespace, not the D-Bus socket. Without mounting `/run/dbus/system_bus_socket`, all three API endpoints fail. **Prevention:** Add the volume mount to docker-compose.yml. **Detection:** `docker exec hjem node -e "const {systemBus} = require('dbus-next'); systemBus().then(b => console.log('OK')).catch(e => console.error('FAIL:', e.message))"`.

2. **D-Bus authentication failure in container** — D-Bus uses EXTERNAL auth with Unix socket credentials. `oven/bun:1-alpine` runs as root (UID 0), which works for the system bus. **Prevention:** Keep container running as root. Don't switch to non-root user. Don't change D-Bus socket permissions (already world-writable).

3. **Race conditions on rapid start/stop clicks** — Multiple `StartUnit` calls can enqueue multiple jobs. **Prevention:** Frontend disables buttons immediately on click + client-side `if (actionInProgress.value) return` guard. systemd's `"replace"` mode handles backend dedup.

4. **D-Bus socket missing after container restart** — If the mount is misconfigured or D-Bus restarts. **Prevention:** API routes should catch connection errors and return meaningful messages ("Server control unavailable — D-Bus not connected").

**Moderate:**
- Java OOM-killed (8-10GB RAM) → status returns `failed`, frontend shows crash state
- Stop command hangs → `TimeoutStopSec=60`, frontend offers force kill after timeout
- EULA not accepted → Include in setup instructions

**Minor:**
- D-Bus connection not cached → Must cache at module level (file descriptor leak)
- dbus-next version drift → Pin exact version `"dbus-next": "0.10.2"` in package.json
- Inconsistent tile styling → Copy AppTile's scoped CSS classes (same dimensions, overlay, glow)

## Implications for Roadmap

Based on dependency analysis (systemd service must exist before API routes can be tested, API routes must exist before tile can be built), the research suggests five phases:

### Phase 1: Host Setup — systemd Service + D-Bus Verification
**Rationale:** Everything depends on the systemd service existing on the host. The API routes cannot be developed or tested without it. This phase is entirely host-side work.

**Delivers:** A working `mcserver.service` that can be controlled via `systemctl start/stop` manually. Verified D-Bus communication path.

**Addresses:** Foundational dependency for all features (FEATURES.md dependency tree shows systemd service at root).

**Avoids:** Pitfall 1 (container can't reach host systemd) — we verify the socket path and service work before any code is written.

**Tasks:**
- Create `/etc/systemd/system/mcserver.service` on host with exact Java args from existing `user_jvm_args.txt` and `variables.txt`
- Run `systemctl daemon-reload` and verify with `systemctl cat mcserver`
- Ensure service is disabled: `systemctl disable mcserver`
- Verify commands manually: `sudo systemctl start mcserver`, check `systemctl status mcserver`, then `stop`
- EULA check: ensure `eula=true` in server directory

**Research flag:** No deeper research needed. This follows standard systemd unit creation patterns. The Java command line must be verified against the existing startup scripts.

### Phase 2: Docker Integration — D-Bus Socket Mount + dbus-next Install
**Rationale:** The container needs the D-Bus socket mounted and the `dbus-next` package installed before API routes can be developed. This phase bridges host and container.

**Delivers:** A container that can communicate with host systemd via D-Bus.

**Uses:** dbus-next 0.10.2 (STACK.md), D-Bus socket mount (ARCHITECTURE.md).

**Avoids:** Pitfall 2 (D-Bus auth failure) — we test the connection inside the container immediately.

**Tasks:**
- `bun add dbus-next@0.10.2` (pin exact version)
- Add volume mount to docker-compose.yml: `- /run/dbus/system_bus_socket:/run/dbus/system_bus_socket`
- Rebuild and verify: `docker compose up -d --build`
- Test D-Bus connectivity: `docker exec hjem node -e "..."` using dbus-next

**Research flag:** Standard Docker volume mount — no deeper research needed. But the D-Bus connection test script should be added to a Makefile or README for debugging.

### Phase 3: Server API Routes — systemd Utility + Endpoints
**Rationale:** The API routes are the bridge between the frontend tile and the host systemd. They must be built and tested (via curl or browser dev tools) before the tile can connect to them.

**Delivers:** Three working API endpoints: `GET /api/mc/status`, `POST /api/mc/start`, `POST /api/mc/stop`.

**Uses:** `server/utils/systemd.ts` (ARCHITECTURE.md), method-suffixed file naming (.get.ts, .post.ts).

**Implements:** Thin API handlers pattern (ARCHITECTURE.md Pattern 1).

**Avoids:** Pitfall "D-Bus connection not cached" — the shared utility caches the bus at module level.

**Tasks:**
- Create `server/utils/systemd.ts` with cached D-Bus connection + `getUnitState`, `startUnit`, `stopUnit`
- Create `server/api/mc/status.get.ts` — returns state from `getUnitState`
- Create `server/api/mc/start.post.ts` — calls `startUnit`, returns success
- Create `server/api/mc/stop.post.ts` — calls `stopUnit`, returns success
- Verify all three endpoints work (use `curl` or REST client)

**Research flag:** The D-Bus API is well-documented (stable since systemd v44+). No deeper research needed.

### Phase 4: Frontend Tile — ServerTile.vue Component
**Rationale:** The tile depends on the API endpoints existing. Building it earlier means testing against unimplemented routes. This phase is pure frontend work once the backend is confirmed working.

**Delivers:** Interactive tile on the dashboard showing server status with start/stop functionality.

**Uses:** New `ServerTile.vue` component (not modifying `AppTile.vue`). Component-local reactive state. Polling with cleanup.

**Implements:** Interactive component state machine (ARCHITECTURE.md Pattern 2).

**Addresses:** All P1 features: status indicator, start/stop buttons, transitional states, error feedback, auto-refresh on mount.

**Avoids:** Pitfall "race conditions on rapid clicks" — buttons disabled immediately + client-side action guard.

**Tasks:**
- Create `app/components/ServerTile.vue` with:
  - Status dot (green/red/yellow/orange/gray) + text label
  - Start/Stop button that disables during transitions
  - Error state with retry option
  - Background image with dark overlay (matching AppTile style)
  - `onMounted` fetch + polling strategy
  - `onUnmounted` cleanup for polling intervals
- Add ServerTile to `pages/index.vue` alongside existing AppTile instances
- Test all transitions manually

**Research flag:** The existing AppTile component should be read to understand its CSS structure for visual consistency. This is a code reading task, not a research task.

### Phase 5: Integration, Polish, and P2 Features
**Rationale:** Polish and enhanced features come after the core flow works. This phase adds robustness and handles edge cases.

**Delivers:** Production-ready tile with crash detection, polling after actions, and graceful error handling.

**Addresses:** P2 features from FEATURES.md — polling after start/stop, crash detection, stop timeout + force kill.

**Avoids:** Pitfall "Java OOM-killed" — crash detection surfaces this to the user. Pitfall "stop hangs" — timeout + force kill.

**Tasks:**
- Implement polling after start (2s intervals for 30s)
- Implement polling after stop (2s intervals for 10s, then 5s)
- Crash detection: poll notices unexpected `inactive` → show "Server stopped unexpectedly"
- Stop timeout: if status still active after 60s, offer "Force Stop" (calls KillUnit)
- Verify tile styling consistent with AppTile
- Add origin check + rate limiting to API routes (optional lightweight security)

### Phase Ordering Rationale

- **Host → Container → API → Frontend:** This is a strict dependency chain. Each phase produces something the next consumes. Building out of order means testing against unavailable dependencies.
- **systemd service first:** The API routes literally cannot be tested without the service file existing. Manual verification of `systemctl start/stop` is the fastest path to a working system.
- **API routes before frontend:** The tile needs real API data. Building it against mock data adds rework when the actual API behaves differently (e.g., error responses, polling behavior).
- **P2 features last:** They add polish but aren't needed for the core flow to work. Launch with P1, add P2 when stable.

### Research Flags

Phases likely needing deeper research during planning:
- **None.** All phases use well-documented technologies (systemd, Docker volumes, dbus-next, Nuxt 4 server routes, Vue 3 components).

Phases that benefit from code reading during planning:
- **Phase 4:** Need to read existing `AppTile.vue` to match CSS structure, overlay gradient, dimensions (300px × 200px), and glow effect for `ServerTile.vue`.

Phases with standard patterns (skip research-phase):
- **Phase 1-3, 5:** Standard systemd unit creation, Docker volume mounts, Nuxt server routes, Vue components. All patterns are documented in the research files.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against: dbus-next npm (pure JS, no native deps, works on Alpine), systemd D-Bus API docs (stable since v44+), host verification (socket exists with correct permissions), Docker verification (oven/bun:1-alpine runs as root). |
| Features | HIGH | Derived from PROJECT.md requirements + competitive analysis (Crafty, AMP, Pterodactyl) + existing codebase patterns. Feature prioritization is validated by the state machine design and dependency tree. |
| Architecture | HIGH | Based on Nuxt 4 server route docs (official), systemd D-Bus API (official), dbus-next documentation, and the existing file structure of the project. The thin-handler pattern and separate-component-for-interactive-tile decisions are grounded in concrete analysis of AppTile's current implementation. |
| Pitfalls | HIGH | Host-verified facts (D-Bus socket path, Alpine package availability, Docker behavior with mount points). Docker namespace isolation is well-documented behavior. Race condition prevention patterns are standard. |

**Overall confidence:** HIGH

### Gaps to Address

These items need validation during implementation but don't fundamentally affect the research conclusions:

1. **Exact Java arguments in ExecStart:** The `@user_jvm_args.txt` and `@variables.txt` paths must be verified against the actual files in `/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/`. The current startup scripts should be read to confirm args. **(Impact: Low — easy to fix, only affects the service file.)**

2. **dbus-next error handling for specific D-Bus errors:** The `getUnitState` function returns `'not-found'` on any error. During implementation, verify that D-Bus errors for specific cases (service not found, permission denied) are distinguishable and surface properly as API error responses. **(Impact: Low — error handling refinement, doesn't change architecture.)**

3. **Polling interval tuning:** The suggested 2s/30s/60s intervals are reasonable starting points based on typical MC server boot times (60-90s for Forge). Verify with actual server behavior after the first couple of starts. **(Impact: Low — constant tuning, doesn't affect structure.)**

## Sources

### Primary (HIGH confidence — verified)
- **PROJECT.md** — Requirements, constraints, out-of-scope decisions, context
- **systemd D-Bus API docs** (`org.freedesktop.systemd1.Manager`) — Stable interface since v44+
- **dbus-next npm package** (v0.10.2) — Pure JS, tested on bun:1-alpine, no native deps
- **Host verification** — `/run/dbus/system_bus_socket` exists with `srw-rw-rw-` permissions
- **Docker verification** — `oven/bun:1-alpine` runs as root, no systemd package in Alpine repos
- **Nuxt 4 server routes docs** — Zero-config `/server/api/` auto-registration

### Secondary (MEDIUM confidence — community/codebase)
- **Existing codebase analysis** — AppTile.vue structure, Dockerfile, docker-compose.yml, nuxt.config.ts
- **Crafty Controller / AMP / Pterodactyl** — Competitive feature reference for MC server management
- **D-Bus specification** — EXTERNAL auth mechanism, Unix socket protocol

### Tertiary (LOW confidence — inference)
- **Rapid click race condition behavior** — systemd `"replace"` mode behavior inferred from documentation (not tested with actual Forge server). Verify during Phase 1.

---

*Research completed: 2026-04-29*
*Ready for roadmap: yes*
