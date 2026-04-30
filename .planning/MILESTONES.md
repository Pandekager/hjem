# Milestones

## v1.0 Minecraft Server Tile (Shipped: 2026-04-30)

**Phases completed:** 5 phases, 5 plans, 12 tasks

**Key accomplishments:**

- Systemd service for BMC4 Forge 1.20.1 Minecraft server with verified start/stop/status control, disabled at boot per HOST-02
- Host D-Bus socket mounted into container + dbus-next@0.10.2 installed, verified systemd reachable from inside container
- Nuxt server API routes that communicate with host systemd via D-Bus to control the Minecraft server
- Interactive Minecraft server control tile with photo background, state display, and start/stop controls
- Crash detection, force kill, and robustness enhancements for the MC Server tile

---
