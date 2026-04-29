# Domain Pitfalls

**Domain:** Minecraft server control tile on Nuxt 4 dashboard (D-Bus integration)
**Researched:** 2026-04-29 (updated with D-Bus approach)
**Confidence:** HIGH

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Container Can't Reach Host systemd

**What goes wrong:** The API routes try to run `systemctl` or call D-Bus inside the Docker container, but the container doesn't have access to the host's D-Bus socket. Commands fail with "Failed to connect to bus" errors.

**Why it happens:** The assumption "Dashboard runs in Docker with `network_mode: host` — API routes can access systemd on the host" is **incorrect**. `network_mode: host` only shares the network namespace. The container still has its own PID namespace, mount namespace, and D-Bus namespace. Without mounting the D-Bus socket, the container cannot communicate with host systemd.

**Consequences:** All three API endpoints (status, start, stop) fail. The tile shows "error" permanently.

**Prevention:** Mount the host's D-Bus socket into the container:
```yaml
# docker-compose.yml
volumes:
  - /run/dbus/system_bus_socket:/run/dbus/system_bus_socket
```

**Detection:** Test by running a connection test inside the container:
```bash
docker exec hjem node -e "
  const { systemBus } = require('dbus-next');
  systemBus().then(bus => console.log('Connected!')).catch(e => console.error('FAILED:', e.message))
"
```

### Pitfall 2: D-Bus Authentication Failure in Container

**What goes wrong:** Even with the socket mounted, D-Bus authentication fails because the container's process credentials don't match what D-Bus expects.

**Why it happens:** D-Bus uses EXTERNAL authentication, passing the process's UID via the Unix socket credentials. In Docker without user namespace remapping, root in the container is UID 0 on the host, which should work. However, if the host uses a non-standard D-Bus configuration or if the container runs with a different user, authentication can fail.

**Consequences:** dbus-next connection throws "Authentication failed" or "Connection refused."

**Prevention:**
- Default `oven/bun:1-alpine` runs as root (UID 0). This works because the D-Bus system socket allows root access.
- If running as non-root: create a polkit rule on the host to allow unit management (see ARCHITECTURE.md).
- Do NOT change D-Bus socket permissions — they're already world-writable (`srw-rw-rw-`).

**Detection:** Check the error message from dbus-next's `systemBus()` call.

### Pitfall 3: Race Conditions on Rapid Start/Stop Clicks

**What goes wrong:** User clicks Start rapidly three times. Three `StartUnit` D-Bus calls fire in parallel. systemd may enqueue multiple jobs.

**Why it happens:** D-Bus API routes fire on every request without deduplication. The frontend doesn't debounce.

**Consequences:** Multiple Java processes competing for 10GB RAM each. Server crash. Confused status display.

**Prevention:**
- Frontend: Buttons are immediately disabled on click (optimistic UI)
- Frontend: Add client-side guard: `if (actionInProgress.value) return`
- Backend: systemd's D-Bus API handles this gracefully — `StartUnit` on an already-starting or running service creates a job that replaces the previous "start" job (the `"replace"` mode). But still prevent needless D-Bus traffic.

**Detection:** Click start rapidly. Check if multiple Java processes appear (`ps aux | grep java`).

### Pitfall 4: D-Bus Socket Missing After Container Restart

**What goes wrong:** The container restarts, but the D-Bus socket mount is misconfigured or the host's D-Bus is in a different location.

**Why it happens:** The D-Bus socket path is hardcoded in docker-compose.yml. If the host uses a non-standard path, or if dbus-daemon is restarted and the socket path changes, the mount breaks.

**Prevention:**
- The standard path is `/run/dbus/system_bus_socket` — this is the same on virtually all Linux distributions with D-Bus
- Add validation: the API routes should catch connection errors and return a meaningful message like "Server control unavailable — D-Bus not connected"

**Detection:** Check the container logs for "Failed to connect to bus" after restart.

## Moderate Pitfalls

### Pitfall 1: Java Process Gets OOM-Killed

**What goes wrong:** The MC server allocates 8-10GB RAM. If other services on the host consume memory, the kernel OOM-killer terminates the Java process.

**Prevention:**
- The status endpoint will return `failed` instead of `active` after OOM kill
- Frontend shows "Server crashed" or "Server stopped unexpectedly"
- Consider adding `MemoryMax=12G` to the systemd unit as a safety limit

### Pitfall 2: Stop Command Hangs (Graceful Shutdown Fails)

**What goes wrong:** `Manager.StopUnit` sends SIGTERM to Java, but the server doesn't shut down within `TimeoutStopSec`.

**Prevention:**
- Set `TimeoutStopSec=60` in the service file (60s is generous for MC world save)
- Frontend: if status doesn't become `stopped` after 60s, show "Shutdown may have timed out"
- Add a "Force Stop" option (calls `Manager.KillUnit` with SIGKILL) available after a timeout

### Pitfall 3: Alpine Missing D-Bus Socket Path

**What goes wrong:** Alpine Linux doesn't have `/run/dbus/` directory in the base image. When the socket is mounted, the directory is created by Docker. But if the mount point doesn't exist in the container, Docker creates it as root-owned directory.

**Why it happens:** This is actually fine — Docker creates the mount point directory automatically. But if a file or directory exists at that path in the image, it gets overlaid.

**Prevention:** No action needed. Docker handles this correctly. The `oven/bun:1-alpine` image has no `/run/dbus/` directory, so the mount will create it.

### Pitfall 4: EULA Not Accepted

**What goes wrong:** If `eula.txt` is missing or `eula=false`, the MC server won't start.

**Prevention:** Ensure `eula.txt` exists with `eula=true` before first start. Include a note in setup instructions.

## Minor Pitfalls

### Pitfall 1: Incorrect Working Directory in Service

**Prevention:** Double-check the `WorkingDirectory` path: `/home/rasmus/Games/MCServer/BMC4_Server_Pack_v57.5/`. Verify the `ExecStart` paths are relative to this directory (or absolute).

### Pitfall 2: D-Bus Connection Not Cached

**What goes wrong:** Creating a new `systemBus()` connection on every API call creates unnecessary overhead and leaks file descriptors.

**Prevention:** Cache the bus connection and proxy objects at module level in `server/utils/systemd.ts`. Reuse across API calls. The connection persists for the lifetime of the Nitro server process.

### Pitfall 3: dbus-next Version Compatibility

**What goes wrong:** `dbus-next` 0.10.2 might have API changes in future versions.

**Prevention:** Pin the version in `package.json`: `"dbus-next": "0.10.2"`. Do not use `^` or `~` range.

### Pitfall 4: Tile Styling Inconsistent With AppTile

**Prevention:** Either refactor AppTile to accept an `interactive` prop, or create ServerTile that duplicates AppTile's visual styling.

### Pitfall 5: HTTP 405 from `readBody` in GET handlers

**Prevention:** Use method-suffixed filenames (.get.ts, .post.ts). Status endpoint is GET only. Start/stop are POST only.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Systemd service creation | Java args incorrect or incomplete | Copy exact parameters from `start.sh`/`variables.txt`/`user_jvm_args.txt`. Test the command manually first. |
| D-Bus socket mount | Path incorrect | Verify `/run/dbus/system_bus_socket` exists on host. Test: `docker exec hjem ls -la /run/dbus/system_bus_socket` |
| dbus-next API route development | D-Bus bus not cached | Create connection at module level, reuse across requests |
| Frontend tile development | Inconsistent styling with AppTile | Copy AppTile's CSS classes (scoped styles). Maintain same dimensions, overlay, glow. |
| Docker build | Missing dbus-next dependency | Add `bun add dbus-next@0.10.2` explicitly. Pin version. |
| Testing | Can't test systemd interaction locally | Use a mock for `server/utils/systemd.ts` in dev mode. Or: test against staging with real D-Bus. |

## Sources

- Docker container and namespace isolation documentation
- Alpine Linux package repository: `systemd` package NOT available, `dbus` package IS available
- D-Bus specification: EXTERNAL auth mechanism, Unix socket protocol
- Node.js `dbus-next` library documentation
- systemd D-Bus API: `org.freedesktop.systemd1.Manager` interface documentation
- systemd.service(5) man page: `Type=simple`, `TimeoutStopSec`, `KillMode`
- Host verification: `/run/dbus/system_bus_socket` exists, world-writable
- [dbus-next GitHub](https://github.com/dbusjs/node-dbus-next) — pure JS, no native deps

---

*Domain pitfalls research for: Minecraft server control tile on Nuxt 4 dashboard*
*Researched: 2026-04-29*
