# Stack Research

**Project:** Hjem Dashboard — Minecraft Server Tile
**Researched:** 2026-04-29
**Confidence:** HIGH

## Recommended Stack

### Existing Stack (unchanged)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Nuxt 4 | ^4.4.2 | Full-stack framework | Already in use. Nitro server engine provides `server/api/` routes with zero config. |
| Vue 3 | ^3.5.30 | Frontend framework | Already in use. Powers all components. |
| Vue Router | ^5.0.3 | Client-side routing | Already in use. |
| Bun | 1.3.x | Runtime + package manager | Already in use. Also used in Docker production image. Smaller than Node. |
| Alpine Linux | 3.22 | Docker base image | Already in use (`oven/bun:1-alpine`). Lightweight at ~110MB. |

### New Dependencies

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `dbus-next` | 0.10.2 | D-Bus client library for Node.js | Allows Nuxt server API routes to communicate with host systemd via D-Bus protocol. Pure JavaScript — no native compilation, works on Alpine. Connects to mounted `/run/dbus/system_bus_socket`. |
| `node:child_process` (built-in) | Node built-in | Exec `dbus-send` commands | Alternative to `dbus-next` if you prefer shell-based approach. Both work. See comparison below. |

### Chosen Integration Pattern: host D-Bus socket mount

| Technology | Purpose | Notes |
|------------|---------|-------|
| D-Bus system socket | IPC bridge to host systemd | Mount `-v /run/dbus/system_bus_socket:/run/dbus/system_bus_socket` in docker-compose.yml. Container root (uid 0) can write to it — permissions are `srw-rw-rw-`. |
| systemd D-Bus API | Control units programmatically | Interface `org.freedesktop.systemd1.Manager` with `StartUnit`, `StopUnit`, `GetUnit` methods + `org.freedesktop.DBus.Properties` for reading `ActiveState`. |
| systemd (on host) | Process lifecycle for MC server | Already running on host (deployed on `dilleur`). Unit file added at `/etc/systemd/system/mcserver.service`. |

### systemd Unit File: mcserver.service

Not a library choice, but a critical deployment artifact. Must be created on the host **before** API routes are used.

```ini
# /etc/systemd/system/mcserver.service
[Unit]
Description=BMC4 Minecraft Forge Server (1.20.1)
After=network.target

[Service]
Type=simple
User=rasmus
WorkingDirectory=/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5
ExecStart=/usr/bin/java @/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/user_jvm_args.txt @/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/variables.txt -jar /home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/fabric-server-mc.1.20.1-loader.0.15.11-launcher.1.0.1.jar nogui
Restart=on-failure
RestartSec=30
KillMode=process
TimeoutStartSec=120
TimeoutStopSec=60

[Install]
WantedBy=default.target
```

**Key properties:**
- `User=rasmus` — runs as the normal user, not root
- `Type=simple` — systemd considers the process started as soon as `ExecStart` forks
- `KillMode=process` — only kills the Java process, not any subprocesses
- `Restart=on-failure` — auto-restart if crashes (but NOT on manual stop via `systemctl stop`)
- `WantedBy=default.target` — but installed with `systemctl enable --now` → we use `systemctl disable` to keep it off at boot (per requirements: "server is off by default")

### D-Bus API Methods Used

These are the systemd D-Bus calls the Nuxt server API routes will make:

| Operation | D-Bus Method | Notes |
|-----------|-------------|-------|
| Check status | `Manager.GetUnit` → `Properties.Get(ActiveState)` | Returns "active", "inactive", "activating", "deactivating", "failed" |
| Start server | `Manager.StartUnit("mcserver.service", "replace")` | "replace" = replaces conflicting jobs. Non-blocking — systemd starts in background. |
| Stop server | `Manager.StopUnit("mcserver.service", "replace")` | Sends SIGTERM to the process group. Non-blocking. |

## Installation

### Dockerfile changes

Add `dbus-next` to package dependencies:

```bash
bun add dbus-next@0.10.2
```

**No Alpine package changes needed.** `dbus-next` is pure JavaScript — it connects to the D-Bus Unix socket directly using Node.js `net` module. No native dependencies, no compilation.

Set `NITRO_UNIX_SOCKET` env var (already set to `0.0.0.0` in existing Dockerfile — no change needed for D-Bus).

### docker-compose.yml changes

Mount the host D-Bus system socket so the container can communicate with host systemd:

```yaml
services:
  hjem:
    # ... existing config ...
    volumes:
      - /run/dbus/system_bus_socket:/run/dbus/system_bus_socket
```

**Why mount the socket (not the binary):** `dbus-next` communicates via Unix socket (D-Bus protocol). It doesn't need `systemctl` or any systemd binaries. The mounted socket is the only bridge needed between container and host systemd.

### systemd unit creation (one-time on host)

```bash
# Create the service file
sudo tee /etc/systemd/system/mcserver.service > /dev/null << 'EOF'
[Unit]
Description=BMC4 Minecraft Forge Server (1.20.1)
After=network.target

[Service]
Type=simple
User=rasmus
WorkingDirectory=/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5
ExecStart=/usr/bin/java @/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/user_jvm_args.txt @/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/variables.txt -jar /home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/fabric-server-mc.1.20.1-loader.0.15.11-launcher.1.0.1.jar nogui
Restart=on-failure
RestartSec=30
KillMode=process
TimeoutStartSec=120
TimeoutStopSec=60

[Install]
WantedBy=default.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Verify unit file is recognized
sudo systemctl cat mcserver > /dev/null && echo "Unit OK"

# Ensure it's disabled (off by default per requirements)
sudo systemctl disable mcserver 2>/dev/null || true

# Verify
systemctl is-enabled mcserver  # should print "disabled"
```

### Nuxt server API route structure

No config changes needed — Nuxt 4 auto-registers `server/api/` routes:

```
server/
  api/
    mc/
      status.get.ts      # GET /api/mc/status — returns { state: "active" | "inactive" | ... }
      start.post.ts      # POST /api/mc/start — starts the server
      stop.post.ts       # POST /api/mc/stop  — stops the server
  utils/
    systemd.ts           # Shared wrapper around dbus-next for systemd operations
```

### Server utility pattern (`server/utils/systemd.ts`)

```typescript
import { systemBus, Message, Variant } from 'dbus-next'

const BUS_NAME = 'org.freedesktop.systemd1'
const MANAGER_PATH = '/org/freedesktop/systemd1'
const MANAGER_IFACE = 'org.freedesktop.systemd1.Manager'
const PROPERTIES_IFACE = 'org.freedesktop.DBus.Properties'
const UNIT_IFACE = 'org.freedesktop.systemd1.Unit'

const bus = systemBus()

let cachedProxy: any = null
async function getManager() {
  if (!cachedProxy) {
    const obj = await bus.getProxyObject(BUS_NAME, MANAGER_PATH)
    cachedProxy = obj.getInterface(MANAGER_IFACE)
  }
  return cachedProxy
}

export async function getUnitState(unit: string): Promise<string> {
  const manager = await getManager()
  try {
    const objectPath = await manager.GetUnit(unit)
    const unitObj = await bus.getProxyObject(BUS_NAME, objectPath)
    const props = unitObj.getInterface(PROPERTIES_IFACE)
    const result: Variant = await props.Get(UNIT_IFACE, 'ActiveState')
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

## Alternatives Considered

### SSH-to-localhost (previously recommended, now DEPRECATED for this project)

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| D-Bus socket mount | SSH keypair to localhost | SSH adds complexity: key generation, `authorized_keys` with `command=` restrictions, host key verification, SSH setup in container. The "command=" restriction for security is fragile. D-Bus is simpler: one volume mount, one npm package, zero host-side config. |

Detailed comparison:

| Criterion | D-Bus socket | SSH-to-host |
|-----------|-------------|-------------|
| Setup steps | 1 (mount socket) | 4+ (key gen, authorized_keys, SSH client, sudoers) |
| Latency | ~1ms (Unix socket) | ~20-50ms (TCP + SSH handshake) |
| Auth complexity | None (socket permissions) | Key management, `command=` restrictions |
| Docker image size impact | 0 (dbus-next is pure JS) | ~5MB (OpenSSH client + deps) |
| Failure mode | Clean (ECONNREFUSED if socket missing) | Complex (SSH host key, auth, sudo failures) |
| Security scope | Full D-Bus system bus access | Restricted by `authorized_keys` command= |
| Maintainability | Simple (1 npm dep, 1 mount) | More moving parts |

### dbus-send (via Alpine `dbus` package) vs dbus-next

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `dbus-next` (npm) | `dbus-send` (Alpine package) | `dbus-send` requires parsing fragile D-Bus output strings. `dbus-next` provides typed, native JavaScript objects. Output parsing of `dbus-send --print-reply` for Variant properties is error-prone. |

### Direct Java process management from Node.js

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| systemd service | `child_process.spawn` directly | Contravenes project requirement ("managed as a systemd service"). Process wouldn't survive container restart. No auto-restart on crash. No journald logging. |

### Debian base image + systemctl

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Alpine + dbus-next | Debian + systemctl | Alpine image is 110MB vs Debian's 266MB (with systemd installed). Switching base images is unnecessary when `dbus-next` handles the D-Bus protocol directly. Only worth considering if you strongly prefer the `systemctl` shell interface. |

**When Debian might make sense:**
- You prefer `systemctl` shell commands over a D-Bus library
- The extra ~156MB image size is not a concern
- You're already familiar with Debian/apt

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `sudo` with password-less rules | Not needed. Container runs as root, D-Bus socket is world-writable. | Direct D-Bus connection via `dbus-next`. |
| OpenSSH client in container | Adds 5MB, SSH key management overhead, latency. | D-Bus socket mount (no extra packages). |
| `dbus-send` shell commands | Fragile output parsing (HTML-like D-Bus introspection format). | `dbus-next` with typed JavaScript objects. |
| systemd `PIDFile=` | Unnecessary for `Type=simple`. Java process is the main process. | Omit — rely on systemd's built-in PID tracking. |
| Docker-in-Docker / Docker socket mount | Overkill for running one systemctl command. | Direct D-Bus communication with systemd. |
| RCON protocol | Out of scope per PROJECT.md. Only status/start/stop needed. | systemd D-Bus API (covers all requirements). |

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `dbus-next@0.10.2` | Bun 1.x, Node.js 18+ | Pure JS — no native modules. Works on any platform. |
| `dbus-next` | D-Bus protocol 1.x | Uses the standard D-Bus Unix socket protocol. Compatible with all modern systemd versions (v240+). |
| Host systemd | v256+ (Arch Linux as of Apr 2026) | D-Bus API is stable and backwards-compatible across systemd versions. The `org.freedesktop.systemd1.Manager` interface has been stable since systemd v44+. |

## Sources

- [Nuxt 4 server routes documentation](https://nuxt.com/docs/guide/directory-structure/server) — Confirmed `server/api/` routes are built-in, zero config, no extra packages needed.
- [Node.js child_process documentation](https://nodejs.org/api/child_process.html) — `exec` and `execSync` are built-in modules.
- [dbus-next npm package](https://www.npmjs.com/package/dbus-next) — v0.10.2 latest. Pure JS D-Bus implementation. Tested on bun:1-alpine — installs cleanly with no native compilation.
- [systemd D-Bus API documentation](https://www.freedesktop.org/software/systemd/man/latest/org.freedesktop.systemd1.html) — Manager interface for `StartUnit`, `StopUnit`, `GetUnit`.
- [D-Bus specification](https://dbus.freedesktop.org/doc/dbus-specification.html) — Protocol for Unix socket communication.
- Host verification: `/run/dbus/system_bus_socket` exists with `srw-rw-rw-` permissions. `/run/systemd/` directory present with `io.systemd.Manager` socket.
- Alpine package verification: `dbus` package available (v1.16.2-r1), `systemd` package **NOT** available in Alpine repos. `oven/bun:1-alpine` image is Alpine 3.22, runs as root.
- Dockerfile verification: Existing Dockerfile uses two-stage build with `oven/bun:1-alpine`. No system packages need to be added for D-Bus approach — `dbus-next` handles everything in JS.

---

*Stack research for: Minecraft server control tile on Nuxt 4 dashboard*
*Researched: 2026-04-29*
