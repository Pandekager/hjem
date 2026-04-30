# Requirements: Hjem Dashboard

**Defined:** 2026-04-29
**Core Value:** The family can access all their home services from one place without remembering URLs or IP addresses.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Host Setup

- [x] **HOST-01**: Systemd service exists for the BMC4 Forge 1.20.1 Minecraft server at `/etc/systemd/system/mcserver.service`
- [x] **HOST-02**: Systemd service is disabled by default (server stays off until explicitly started)
- [x] **HOST-03**: Server can be started manually via `systemctl start mcserver`
- [x] **HOST-04**: Server can be stopped manually via `systemctl stop mcserver`

### Docker Integration

- [x] **DOCK-01**: Host D-Bus socket is mounted into the container at `/run/dbus/system_bus_socket`
- [x] **DOCK-02**: `dbus-next` npm package is installed (pure JS D-Bus client)

### Server API

- [x] **API-01**: User can check Minecraft server status via `GET /api/mc/status`
- [x] **API-02**: User can start the Minecraft server via `POST /api/mc/start`
- [x] **API-03**: User can stop the Minecraft server via `POST /api/mc/stop`
- [x] **API-04**: API returns appropriate errors for invalid actions (e.g., 409 for already running)
- [x] **API-05**: API correctly reports all 5 systemd states: active, inactive, activating, deactivating, failed
- [x] **API-06**: API routes include origin check and rate limiting for LAN safety

### Frontend Tile

- [x] **TILE-01**: User sees current server status (running/stopped/starting/stopping/error) on dashboard
- [x] **TILE-02**: User can start the server from the tile
- [x] **TILE-03**: User can stop the server from the tile
- [x] **TILE-04**: Tile shows transitional states (starting/stopping) with visual feedback
- [x] **TILE-05**: Tile shows error state with retry option when actions fail
- [x] **TILE-06**: Tile has visual consistency with existing tiles (photo background, dark overlay, glow)
- [x] **TILE-07**: Status auto-refreshes on page load

### P2 Polish

- [x] **POLISH-01**: Status auto-polls after start (every 2s for up to 30s) and stop actions until settled
- [x] **POLISH-02**: Server crash detected via periodic polling (unexpected status change to inactive/failed)
- [x] **POLISH-03**: Stop timeout with force kill fallback (offers hard kill if graceful stop exceeds 60s)

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
| HOST-01 | Phase 1 | Complete |
| HOST-02 | Phase 1 | Complete |
| HOST-03 | Phase 1 | Complete |
| HOST-04 | Phase 1 | Complete |
| DOCK-01 | Phase 2 | Complete |
| DOCK-02 | Phase 2 | Complete |
| API-01 | Phase 3 | Complete |
| API-02 | Phase 3 | Complete |
| API-03 | Phase 3 | Complete |
| API-04 | Phase 3 | Complete |
| API-05 | Phase 3 | Complete |
| API-06 | Phase 3 | Complete |
| TILE-01 | Phase 4 | Complete |
| TILE-02 | Phase 4 | Complete |
| TILE-03 | Phase 4 | Complete |
| TILE-04 | Phase 4 | Complete |
| TILE-05 | Phase 4 | Complete |
| TILE-06 | Phase 4 | Complete |
| TILE-07 | Phase 4 | Complete |
| POLISH-01 | Phase 5 | Complete |
| POLISH-02 | Phase 5 | Complete |
| POLISH-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-30 — HOST-01..HOST-04 marked complete after Phase 1 execution*
