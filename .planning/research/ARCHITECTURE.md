# Architecture Research

**Domain:** Nuxt 4 server API routes + systemd service control via D-Bus + interactive tile
**Researched:** 2026-04-29 (updated with D-Bus approach)
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           HOST (dilleur — Arch Linux)                      │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                    Docker (network_mode: host)                       │    │
│  │  ┌───────────────────────────────────────────────────────────────┐  │    │
│  │  │              hjem — Nuxt 4 / Nitro Node.js Server              │  │    │
│  │  │                                                                │  │    │
│  │  │  ┌──────────────────┐   ┌──────────────────────────────────┐  │  │    │
│  │  │  │  Client-side     │   │  Server API Routes                │  │  │    │
│  │  │  │  (Vue 3 SPA)     │   │  ┌─────────────┐                 │  │  │    │
│  │  │  │                  │   │  │ /api/mc/status     GET         │  │  │    │
│  │  │  │  pages/index.vue │──┼──│ /api/mc/start      POST        │  │  │    │
│  │  │  │  ServerTile.vue  │   │  │ /api/mc/stop       POST        │  │  │    │
│  │  │  │                  │   │  └───────┬─────────────────┘      │  │  │    │
│  │  │  └──────────────────┘   │          │                        │  │  │    │
│  │  │                         │          │ dbus-next library      │  │  │    │
│  │  │                         │          ▼                        │  │  │    │
│  │  │                         │  ┌──────────────────┐             │  │  │    │
│  │  │                         │  │ server/utils/    │             │  │  │    │
│  │  │                         │  │ systemd.ts       │             │  │  │    │
│  │  │                         │  │ (dbus-next)      │             │  │  │    │
│  │  │                         │  └──────┬───────┘   │             │  │  │    │
│  │  │                         └─────────┼────────────┘             │  │  │    │
│  │  └───────────────────────────────────┼──────────────────────────┘  │  │    │
│  │                                      │                              │    │
│  │                    Volume mount:      │  /run/dbus/system_bus_socket│    │
│  └──────────────────────────────────────┼─────────────────────────────┘    │
│                                         ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │              systemd (PID 1 on host, via D-Bus IPC)                │      │
│  │  ┌──────────────────────────────────────────────────────────┐    │      │
│  │  │  mcserver.service                                        │    │      │
│  │  │  /home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/     │    │      │
│  │  │  java -Xms8G -Xmx10G -jar fabric-server-*.jar nogui      │    │      │
│  │  └──────────────────────────────────────────────────────────┘    │      │
│  └──────────────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `pages/index.vue` | Orchestrates page layout, passes tile data | Vue SFC, imports AppTile + ServerTile |
| `AppTile.vue` | Renders static link card (unchanged) | Vue SFC, `<a>` element |
| `ServerTile.vue` | **NEW** — Interactive MC server card | Vue SFC, `<div>`, useFetch/useAsyncData |
| `server/api/mc/status.get.ts` | **NEW** — Returns service active state | defineEventHandler, calls systemd D-Bus |
| `server/api/mc/start.post.ts` | **NEW** — Starts service via systemd | defineEventHandler, calls systemd D-Bus |
| `server/api/mc/stop.post.ts` | **NEW** — Stops service via systemd | defineEventHandler, calls systemd D-Bus |
| `server/utils/systemd.ts` | **NEW** — Shared dbus-next wrapper | dbus-next `systemBus()` → org.freedesktop.systemd1.Manager |
| systemd `mcserver.service` | **NEW** — Manages MC server process | systemd unit file on host |

## Recommended Project Structure

```
hjem/
├── server/                          # NEW — Nuxt 4 server routes root
│   ├── api/
│   │   └── mc/
│   │       ├── status.get.ts        # GET  /api/mc/status
│   │       ├── start.post.ts        # POST /api/mc/start
│   │       └── stop.post.ts         # POST /api/mc/stop
│   └── utils/
│       └── systemd.ts               # Shared dbus-next wrapper for systemd
├── app/                             # Existing — Nuxt 4 app directory
│   ├── app.vue                      # Unchanged
│   ├── components/
│   │   ├── AppTile.vue              # Unchanged
│   │   └── ServerTile.vue           # NEW — interactive Minecraft tile
│   ├── pages/
│   │   └── index.vue                # MODIFIED — add ServerTile import
│   └── public/                      # Unchanged
├── docker-compose.yml               # MODIFIED — add D-Bus socket volume mount
├── Dockerfile                       # UNCHANGED!
├── nuxt.config.ts                   # Unchanged (no Nitro config needed)
├── .planning/
│   └── services/
│       └── mcserver.service         # NEW — systemd unit file (reference, installed on host)
└── package.json                     # MODIFIED — added dbus-next dependency
```

### Structure Rationale

- **`server/api/mc/`**: Three endpoints for one resource (minecraft service) grouped by domain. Short prefix `/api/mc/` is clean and avoids misspelling "minecraft."
- **`server/utils/systemd.ts`**: Isolates the systemd communication layer (dbus-next). Makes API handlers thin — they only convert HTTP semantics to domain operations. Can be replaced (e.g., swap dbus-next for a shell-based approach) without touching route handlers.
- **`app/components/ServerTile.vue`**: Separate component from the existing AppTile because the two have fundamentally different interaction models (link vs. interactive state machine). Avoids complicating AppTile with conditional branches.
- **`services/mcserver.service`**: Stored in `.planning/services/` as a reference/documentation file. The actual file is installed on the host at `/etc/systemd/system/mcserver.service`.

## Architectural Patterns

### Pattern 1: Thin API Handlers with Shared Utility Layer

**What:** Each API route handler is a thin shell that calls a shared utility and formats the response. The shared utility (`server/utils/systemd.ts`) encapsulates all systemd/D-Bus communication.

**When to use:** When multiple API endpoints interact with the same external system (here: systemd). Avoids duplicating dbus-next connection logic and provides a single point of change for the systemd integration strategy.

**Trade-offs:** Adds an extra file for small projects. Pays off when you add more endpoints (e.g., restart, logs) or change the communication method (e.g., swap dbus-next for another approach).

**Example:**

```typescript
// server/utils/systemd.ts
import { systemBus } from 'dbus-next'
import { createError } from 'h3'

const BUS_NAME = 'org.freedesktop.systemd1'
const MANAGER_PATH = '/org/freedesktop/systemd1'
const MANAGER_IFACE = 'org.freedesktop.systemd1.Manager'
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties'
const UNIT_IFACE = 'org.freedesktop.systemd1.Unit'

const bus = systemBus()

let cachedManager: any = null
async function getManager() {
  if (!cachedManager) {
    const obj = await bus.getProxyObject(BUS_NAME, MANAGER_PATH)
    cachedManager = obj.getInterface(MANAGER_IFACE)
  }
  return cachedManager
}

export async function getUnitState(unit: string): Promise<string> {
  try {
    const manager = await getManager()
    const objectPath = await manager.GetUnit(unit)
    const unitObj = await bus.getProxyObject(BUS_NAME, objectPath)
    const props = unitObj.getInterface(PROPERTIES_IFACE)
    const result = await props.Get(UNIT_IFACE, 'ActiveState')
    return String(result.value)
  } catch {
    return 'not-found'
  }
}

export async function startUnit(unit: string): Promise<void> {
  const manager = await getManager()
  await manager.StartUnit(unit, 'replace')
}

export async function stopUnit(unit: string): Promise<void> {
  const manager = await getManager()
  await manager.StopUnit(unit, 'replace')
}
```

```typescript
// server/api/mc/status.get.ts
import { getUnitState } from '#server/utils/systemd'

export default defineEventHandler(async () => {
  const state = await getUnitState('mcserver.service')
  return { state }
})
```

### Pattern 2: Interactive Component State Machine

**What:** The ServerTile component implements a finite state machine with four states: `idle` (status known), `loading` (fetching status), `busy` (action in progress: starting/stopping), and `error`. Transitions are unidirectional and dictated by API responses.

**When to use:** Any component that makes async server calls and needs distinct visual states for each phase.

**Trade-offs:** Slightly more verbose than a simple boolean flag. Prevents state bugs.

```
                    ┌──────────┐
                    │  mount   │
                    └────┬─────┘
                         ↓
                    ┌──────────┐      fetch status      ┌──────────┐
            ┌──────→│  idle    │───────────────────────→│ loading  │
            │       └──────────┘                        └────┬─────┘
            │              ↑                                 │
            │              │                            status ok?
            │              │                            ┌────┴────┐
            │              │                            │         │
            │              │                          YES        NO
            │              │                            │         │
            │              │                            ↓         ↓
            │              │                       ┌────────┐ ┌───────┐
            │              │                       │ idle   │ │ error │
            │              │                       │(update │ └───┬───┘
            │              │                       │status) │     │
            │              │                       └────────┘     │ retry?
            │              │                            │         │
            │              │                      ┌─────┘         │
            │              │                      ↓               │
            │              │              user clicks start/stop  │
            │              │                      │               │
            │              │                      ↓               │
            │              │                 ┌──────────┐         │
            │              │                 │  busy    │─────────┘
            │              │                 │(start/   │   error
            │              │                 │ stop)    │
            │              │                 └────┬─────┘
            │              │                      │
            │              │                 ┌────┴─────┐
            │              │              done          timeout
            │              │                 │              │
            │              │                 ↓              ↓
            └──────────────┴─────────── ┌────────┐  ┌──────────┐
                                        │ poll   │  │  error   │
                                        │status  │  └──────────┘
                                        └────────┘
                                            │
                                       status ok?
                                       ┌──┴──┐
                                      YES    NO → keep polling
                                       │
                                       ↓
                                     idle
```

### Pattern 3: Optimistic + Polling Status Updates

**What:** After issuing a start/stop command via D-Bus (which returns immediately — it's async), poll the actual status endpoint to converge on reality.

**When to use:** Any action where the server's response is asynchronous and the client needs to converge on a true state. Here: `systemd StartUnit` returns immediately but Java takes 15-60 seconds to start.

**Trade-offs:** Simpler than WebSocket push. Adds periodic HTTP traffic (trivial for a local dashboard).

**Poll strategy:**
- Normal state: poll `/api/mc/status` every 20-30 seconds
- After start action: poll every 2 seconds for the first 30 seconds, then every 5 seconds
- After stop action: poll every 2 seconds for the first 10 seconds, then every 5 seconds
- On error: back off to 60 seconds, or show retry button
- All polling stops on unmount (use `onUnmounted` + `clearInterval`)

## Data Flow

### Request Flow

```
Status check (page load or poll timer):
─────────────────────────────────────
Browser                                     Nuxt Server                      Host
  │                                            │                              │
  │  GET /api/mc/status                        │                              │
  │───────────────────────────────────────────→│                              │
  │                                            │  dbus-next:                  │
  │                                            │  Manager.GetUnit             │
  │                                            │  → Properties.Get(Active)   │
  │                                            │─────────────────────────────→│
  │                                            │←── { value: "active" } ────│
  │  { state: "active" }                       │                              │
  │←───────────────────────────────────────────│                              │

Start server (user clicks start):
─────────────────────────────────
Browser                                     Nuxt Server                      Host
  │                                            │                              │
  │  POST /api/mc/start                        │                              │
  │───────────────────────────────────────────→│                              │
  │                                            │  dbus-next:                  │
  │                                            │  Manager.StartUnit           │
  │                                            │  ("mcserver.service",        │
  │                                            │   "replace")                 │
  │                                            │─────────────────────────────→│
  │                                            │←──── { job object path } ──│
  │  { success: true }                         │                              │
  │←───────────────────────────────────────────│                              │
  │  [polls /api/mc/status                     │                              │
  │   every 2s until "active"]                │                              │

Stop server (user clicks stop):
────────────────────────────────
Browser                                     Nuxt Server                      Host
  │                                            │                              │
  │  POST /api/mc/stop                         │                              │
  │───────────────────────────────────────────→│                              │
  │                                            │  dbus-next:                  │
  │                                            │  Manager.StopUnit            │
  │                                            │  ("mcserver.service",        │
  │                                            │   "replace")                 │
  │                                            │─────────────────────────────→│
  │                                            │←──── { job object path } ──│
  │  { success: true }                         │                              │
  │←───────────────────────────────────────────│                              │
  │  [polls /api/mc/status                     │                              │
  │   every 2s until "inactive"]              │                              │
```

### State Management

No global state management (Pinia/Vuex) needed. The ServerTile component is self-contained:

```typescript
// Component-local reactive state
const serverState = ref<string>('unknown')  // 'active' | 'inactive' | 'failed' | 'activating' | 'deactivating' | 'not-found'
const error = ref<string | null>(null)
const actionInProgress = ref<'start' | 'stop' | null>(null)
```

The tile is the only component that needs this state. If future tiles also manage services, extract a `useServerControl()` composable to `app/composables/useServerControl.ts`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| systemd (host) | D-Bus system bus via `dbus-next` | Pure JS library (no native deps). Connects to mounted D-Bus socket. |
| D-Bus system bus | Mount `/run/dbus/system_bus_socket` into container | Socket is world-writable (`srw-rw-rw-`). Container runs as root — full access. |
| Minecraft server process | systemd manages as child process via `mcserver.service` unit | Service file installed at `/etc/systemd/system/mcserver.service` on host |

### Docker Integration

**Dockerfile changes: NONE**
- No Alpine package changes needed (dbus-next is pure JS)
- No systemd binary mounts required
- The existing `oven/bun:1-alpine` image works as-is
- Only `dbus-next` npm package added

**docker-compose.yml changes:**

```yaml
services:
  hjem:
    # ... existing config (network_mode: host, etc.) ...
    volumes:
      # D-Bus socket for systemd communication — the ONLY bridge needed
      - /run/dbus/system_bus_socket:/run/dbus/system_bus_socket
```

**Why only the D-Bus socket:** The `dbus-next` library communicates via the D-Bus Unix socket protocol. Unlike `systemctl` (which is a heavyweight binary with shared library dependencies), `dbus-next` is a pure JavaScript implementation of the D-Bus protocol. It connects to the socket directly using Node.js's `net` module. No binaries, no shared libraries, no mount fragility on systemd upgrades.

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `index.vue ↔ ServerTile.vue` | Props (name, icon, description, image) | ServerTile accepts same visual props as AppTile for consistent look |
| `ServerTile.vue ↔ Server API` | `$fetch()` via useFetch | Standard Nuxt composable; no auth headers needed (private LAN) |
| `Server API ↔ systemd.ts` | Direct function imports (`#server/utils/systemd`) | TypeScript-typed interface; encapsulates dbus-next from HTTP handling |
| `systemd.ts ↔ systemd (host)` | dbus-next → D-Bus socket → host systemd | Pure JS D-Bus protocol; synchronous request-response via Unix socket |

## Alternative Approaches Considered

### 1. SSH-to-localhost (REJECTED)

**Approach:** Install OpenSSH client in Alpine container, generate dedicated SSH key, proxy systemctl commands through SSH to localhost with `command=` restriction.

**Rejected because:**
- More setup steps (key gen, authorized_keys, sudoers, host key verification)
- Higher latency (TCP + SSH handshake per request)
- Fragile: SSH host key changes, key permissions, SSH server config
- Larger image (+5MB for OpenSSH client)
- Harder to debug when things go wrong

### 2. dbus-send shell commands (REJECTED)

**Approach:** Install the `dbus` Alpine package (provides `dbus-send`) and use `child_process.exec` to call it with D-Bus method args.

**Rejected because:**
- D-Bus output parsing is fragile (human-readable introspection format)
- `dbus-send` string construction is error-prone for Variant types
- `dbus-next` provides typed, native JavaScript objects instead

### 3. Debian base image + systemctl (ALTERNATIVE — valid if image size not a concern)

**Approach:** Switch Docker base from `oven/bun:1-alpine` to `oven/bun:1-debian`, install `systemd` apt package, use `systemctl` directly.

**Valid when:**
- You strongly prefer the `systemctl` CLI interface
- The extra ~156MB image size (266MB vs 110MB) is acceptable
- You want to avoid the `dbus-next` npm dependency

## Systemd Service Design

The `mcserver.service` file should be placed at `/etc/systemd/system/mcserver.service` on the **host** (not in the container).

```ini
[Unit]
Description=BMC4 Minecraft Forge 1.20.1 Server
After=network.target

[Service]
Type=simple
User=rasmus
WorkingDirectory=/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/
ExecStart=/usr/bin/java @user_jvm_args.txt @variables.txt -jar fabric-server-mc.1.20.1-loader.0.15.11-launcher.1.0.1.jar nogui
Restart=on-failure
RestartSec=30
KillMode=process
TimeoutStartSec=120
TimeoutStopSec=60

[Install]
WantedBy=default.target
```

**Key design decisions:**
- `User=rasmus`: Server runs as normal user, not root. Matches current manual startup.
- `Type=simple`: Java process runs in foreground; systemd tracks PID directly.
- `Restart=on-failure`: Auto-restart on crash but NOT on manual stop (systemd distinguishes between admin-requested stop and crash).
- `KillMode=process`: Ensures the entire Java process tree is killed on stop.
- `TimeoutStartSec=120`: Forge server can take 60-90s to boot on first launch.
- `TimeoutStopSec=60`: MC world save should complete within 60s.
- **NOT enabled** (off by default per requirements). Manually started via dashboard.

## Anti-Patterns

### Anti-Pattern 1: Exposing systemd commands through API parameters

```typescript
// BAD — allows arbitrary D-Bus calls
export default defineEventHandler(async (event) => {
  const { unit, action } = await readBody(event)
  // DON'T do this
})
```

**Do this instead:** Hard-code the service name. Enumerate permitted operations.

### Anti-Pattern 2: Blocking the UI during start/stop

**Do this instead:** systemd's D-Bus `StartUnit` is already non-blocking — it returns a job object path immediately. The client polls status to track progress.

### Anti-Pattern 3: Running Docker in privileged mode

**Do this instead:** Mount only the D-Bus socket. No `privileged: true` needed.

### Anti-Pattern 4: Polling without cleanup

**Do this instead:** Always pair `setInterval` with `onUnmounted` cleanup.

## Security Considerations

This architecture operates in a private LAN context (Tailscale, no external exposure). The threat model is:

1. **Insider threat (trusted family members):** Minimal. No auth or access control needed.
2. **Compromised device on LAN:** If a device on the LAN is compromised, the attacker can already access the dashboard (it's on port 3002). Mounting the D-Bus socket doesn't change this significantly — systemd unit management is a relatively low-risk capability.
3. **D-Bus socket access:** The container runs as root and the D-Bus system socket is world-writable. This gives the container the ability to manage any systemd unit, not just the MC server. Mitigation: this is a private LAN with trusted users only.

Security measures that still apply:
- API routes do NOT expose arbitrary command execution (anti-pattern 1)
- The D-Bus socket could be mounted read-only (though write is needed for StartUnit/StopUnit)
- `GetUnit` is read-only and safe
- The systemd unit has `Restart=on-failure`

## Sources

- [Nuxt 4 server directory structure](https://nuxt.com/docs/guide/directory-structure/server) — Official Nuxt docs
- [dbus-next npm package](https://www.npmjs.com/package/dbus-next) — v0.10.2, pure JS, tested on bun:1-alpine
- [systemd D-Bus API](https://www.freedesktop.org/software/systemd/man/latest/org.freedesktop.systemd1.html) — Manager interface specification
- [D-Bus specification](https://dbus.freedesktop.org/doc/dbus-specification.html) — Protocol reference
- **Host verification:** `/run/dbus/system_bus_socket` exists with `srw-rw-rw-`. `/run/systemd/` directory present with `io.systemd.Manager` socket.
- **Docker verification:** `oven/bun:1-alpine` runs as root (uid 0). Systemd package NOT in Alpine repos. dbus-next installs cleanly (pure JS, 119 npm packages including transitive deps).

---

*Architecture research for: Hjem dashboard — Minecraft server tile*
*Researched: 2026-04-29*
