# Roadmap: Hjem Dashboard

## Milestones

- ✅ **v1.0 Minecraft Server Tile** — Phases 1-5 (shipped 2026-04-30)

## Phases

<details>
<summary>✅ v1.0 Minecraft Server Tile (Phases 1-5) — SHIPPED 2026-04-30</summary>

- [x] **Phase 1: Host Setup** — systemd service for BMC4 Forge 1.20.1 server
- [x] **Phase 2: Docker Integration** — D-Bus socket mount + dbus-next install
- [x] **Phase 3: Server API Routes** — status, start, stop, kill endpoints with security
- [x] **Phase 4: Frontend Tile** — interactive ServerTile.vue with photo background
- [x] **Phase 5: Integration & Polish** — crash detection, force kill, stop timeout

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 1. Host Setup | v1.0 | 1/1 | Complete | 2026-04-30 |
| 2. Docker Integration | v1.0 | 1/1 | Complete | 2026-04-30 |
| 3. Server API Routes | v1.0 | 1/1 | Complete | 2026-04-30 |
| 4. Frontend Tile | v1.0 | 1/1 | Complete | 2026-04-30 |
| 5. Integration & Polish | v1.0 | 1/1 | Complete | 2026-04-30 |

## Dependency Graph

```
Phase 1 (Host Setup) ──→ Phase 2 (Docker Integration) ──→ Phase 3 (Server API) ──→ Phase 4 (Frontend Tile) ──→ Phase 5 (Polish)
```

Each phase produces something the next consumes.
