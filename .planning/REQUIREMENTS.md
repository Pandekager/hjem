# Requirements: Hjem Dashboard

**Defined:** 2026-04-29
**Core Value:** The family can access all their home services from one place without remembering URLs or IP addresses.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Host Setup

- [ ] **HOST-01**: Systemd service exists for the BMC4 Forge 1.20.1 Minecraft server at `/etc/systemd/system/mcserver.service`
- [ ] **HOST-02**: Systemd service is disabled by default (server stays off until explicitly started)
- [ ] **HOST-03**: Server can be started manually via `systemctl start mcserver`
- [ ] **HOST-04**: Server can be stopped manually via `systemctl stop mcserver`

### Docker Integration

- [ ] **DOCK-01**: Host D-Bus socket is mounted into the container at `/run/dbus/system_bus_socket`
- [ ] **DOCK-02**: `dbus-next` npm package is installed (pure JS D-Bus client)

### Server API

- [ ] **API-01**: User can check Minecraft server status via `GET /api/mc/status`
- [ ] **API-02**: User can start the Minecraft server via `POST /api/mc/start`
- [ ] **API-03**: User can stop the Minecraft server via `POST /api/mc/stop`
- [ ] **API-04**: API returns appropriate errors for invalid actions (e.g., 409 for already running)
- [ ] **API-05**: API correctly reports all 5 systemd states: active, inactive, activating, deactivating, failed
- [ ] **API-06**: API routes include origin check and rate limiting for LAN safety

### Frontend Tile

- [ ] **TILE-01**: User sees current server status (running/stopped/starting/stopping/error) on dashboard
- [ ] **TILE-02**: User can start the server from the tile
- [ ] **TILE-03**: User can stop the server from the tile
- [ ] **TILE-04**: Tile shows transitional states (starting/stopping) with visual feedback
- [ ] **TILE-05**: Tile shows error state with retry option when actions fail
- [ ] **TILE-06**: Tile has visual consistency with existing tiles (photo background, dark overlay, glow)
- [ ] **TILE-07**: Status auto-refreshes on page load

### P2 Polish

- [ ] **POLISH-01**: Status auto-polls after start (every 2s for up to 30s) and stop actions until settled
- [ ] **POLISH-02**: Server crash detected via periodic polling (unexpected status change to inactive/failed)
- [ ] **POLISH-03**: Stop timeout with force kill fallback (offers hard kill if graceful stop exceeds 60s)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Future

- **FUTR-01**: Restart button
- **FUTR-02**: Console output snippet on tile
- **FUTR-03**: Player count display
- **FUTR-04**: Scheduled start/stop
- **FUTR-05**: Server version info display

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| RCON / in-game commands | Overkill for simple start/stop tile, adds auth complexity |
| Online player list | Requires server protocol query, not needed for start/stop |
| Server metrics (CPU/RAM/TPS) | Dashboard is a launcher, not a monitoring tool |
| Auto-start on dashboard load | Server intentionally off-by-default to save 8-10GB RAM |
| Multiple Minecraft servers | Single BMC4 server only |
| Mobile push notifications | Out of scope — dashboard is a passive launcher |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOST-01 | Phase 1 | Pending |
| HOST-02 | Phase 1 | Pending |
| HOST-03 | Phase 1 | Pending |
| HOST-04 | Phase 1 | Pending |
| DOCK-01 | Phase 2 | Pending |
| DOCK-02 | Phase 2 | Pending |
| API-01 | Phase 3 | Pending |
| API-02 | Phase 3 | Pending |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| API-06 | Phase 3 | Pending |
| TILE-01 | Phase 4 | Pending |
| TILE-02 | Phase 4 | Pending |
| TILE-03 | Phase 4 | Pending |
| TILE-04 | Phase 4 | Pending |
| TILE-05 | Phase 4 | Pending |
| TILE-06 | Phase 4 | Pending |
| TILE-07 | Phase 4 | Pending |
| POLISH-01 | Phase 5 | Pending |
| POLISH-02 | Phase 5 | Pending |
| POLISH-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after initial definition*
