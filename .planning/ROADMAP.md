# Roadmap: Hjem Dashboard v1.0

**Milestone:** v1.0 Minecraft Server Tile
**Granularity:** Standard
**Created:** 2026-04-30

## Summary

Add an interactive Minecraft server tile to the Hjem Dashboard. The BMC4 Forge server runs as a systemd service on the host, controlled via D-Bus from inside the Docker container through Nuxt 4 server API routes.

## Phases

- [ ] **Phase 1: Host Setup** — Create systemd service for the BMC4 Forge 1.20.1 server on the host
- [ ] **Phase 2: Docker Integration** — Mount D-Bus socket and install dbus-next for host communication
- [ ] **Phase 3: Server API Routes** — Build Nuxt server endpoints for status, start, and stop
- [ ] **Phase 4: Frontend Tile** — Create interactive ServerTile.vue with status display and controls
- [ ] **Phase 5: Integration & Polish** — Add polling, crash detection, and graceful stop timeout

## Phase Details

### Phase 1: Host Setup
**Goal**: The BMC4 Minecraft server can be managed as a systemd service on the host machine
**Depends on**: Nothing (host-side foundation)
**Requirements**: HOST-01, HOST-02, HOST-03, HOST-04
**Success Criteria** (what must be TRUE):
  1. User can check server status via `systemctl status mcserver` and see active/inactive state
  2. User can start the server via `sudo systemctl start mcserver` and the Java process launches successfully
  3. User can stop the server via `sudo systemctl stop mcserver` and the Java process terminates cleanly
  4. Server does NOT start automatically on boot (service is disabled by default)
  5. Systemd service file exists at `/etc/systemd/system/mcserver.service` with correct Java arguments
**Plans**: TBD
**UI hint**: no

### Phase 2: Docker Integration
**Goal**: The dashboard container can communicate with host systemd via D-Bus
**Depends on**: Phase 1 (needs the systemd service to exist and be verifiable)
**Requirements**: DOCK-01, DOCK-02
**Success Criteria** (what must be TRUE):
  1. Host D-Bus socket is mounted into the container at `/run/dbus/system_bus_socket`
  2. `dbus-next` npm package is installed (pinned to exact version)
  3. A D-Bus connection test script can successfully connect to the system bus from inside the container
  4. Rebuilding and restarting the container applies the new volume mount
**Plans**: TBD
**UI hint**: no

### Phase 3: Server API Routes
**Goal**: The dashboard provides API endpoints for checking server status and controlling start/stop
**Depends on**: Phase 2 (needs D-Bus connectivity from inside the container)
**Requirements**: API-01, API-02, API-03, API-04, API-05, API-06
**Success Criteria** (what must be TRUE):
  1. User can call `GET /api/mc/status` and receive the current systemd state (active, inactive, activating, deactivating, failed)
  2. User can call `POST /api/mc/start` and the server begins starting up
  3. User can call `POST /api/mc/stop` and the server begins shutting down
  4. API returns appropriate HTTP error codes for invalid actions (e.g. 409 when starting an already-running server)
  5. API routes include origin check and rate limiting for LAN safety
**Plans**: TBD
**UI hint**: no

### Phase 4: Frontend Tile
**Goal**: Users can see the MC server status and start/stop it directly from the dashboard
**Depends on**: Phase 3 (tile needs working API endpoints)
**Requirements**: TILE-01, TILE-02, TILE-03, TILE-04, TILE-05, TILE-06, TILE-07
**Success Criteria** (what must be TRUE):
  1. User sees the current server status (running/stopped/starting/stopping/error) displayed on the dashboard tile
  2. User can click a start button to start the server and sees transitional "starting" feedback
  3. User can click a stop button to stop the server and sees transitional "stopping" feedback
  4. Tile shows an error state with a retry option when actions fail
  5. Tile is visually consistent with existing dashboard tiles (photo background, dark overlay gradient, glow)
**Plans**: TBD
**UI hint**: yes

### Phase 5: Integration & Polish
**Goal**: The tile is robust with auto-polling, crash detection, and graceful stop handling
**Depends on**: Phase 4 (polish extends the working tile)
**Requirements**: POLISH-01, POLISH-02, POLISH-03
**Success Criteria** (what must be TRUE):
  1. After starting the server, tile automatically polls status every 2s (up to 30s) until settled
  2. After stopping the server, tile automatically polls until the server is confirmed stopped
  3. If the server crashes unexpectedly, tile detects it via periodic polling and shows crash state
  4. If graceful stop exceeds 60 seconds, user is offered a force kill option
**Plans**: TBD
**UI hint**: yes

## Dependency Graph

```
Phase 1 (Host Setup) ──→ Phase 2 (Docker Integration) ──→ Phase 3 (Server API) ──→ Phase 4 (Frontend Tile) ──→ Phase 5 (Polish)
```

Each phase produces something the next consumes. Building out of order means testing against unavailable dependencies.

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Host Setup | 0/0 | Not started | - |
| 2. Docker Integration | 0/0 | Not started | - |
| 3. Server API Routes | 0/0 | Not started | - |
| 4. Frontend Tile | 0/0 | Not started | - |
| 5. Integration & Polish | 0/0 | Not started | - |
