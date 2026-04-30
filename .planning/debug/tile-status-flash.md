---
slug: tile-status-flash
status: resolved
trigger: "It is still gray the dot sometimes when running. When I press stop it briefly show green before shifting to orange and then gray."
created: 2026-04-30T13:30:00+02:00
updated: 2026-04-30T13:30:00+02:00
---

## Symptoms

- Dot shows gray (Stoppet) when server is actually running (active)
- When pressing Stop, tile briefly flashes green (Kører) before showing orange (Stopper...) then gray (Stoppet)

## Current Focus

**Hypothesis:** `serverState.value = res.state` in `startPolling()` unconditionally overwrites the transitional state set by `stopServer()` / `startServer()`. When the first poll returns `active` (server still processing the stop), it overwrites `deactivating` → shows green flash.

**Root cause confirmed:** Line `serverState.value = res.state` should only update when the poll result is the target state or a terminal state (failed), not during intermediate transitions.

## Evidence

- `startPolling('inactive', STOP_TIMEOUT)` is called in `stopServer()`
- First interval: `$fetch('/api/mc/status')` returns `{state: "active"}` (process not yet killed)
- `serverState.value = "active"` overwrites the `"deactivating"` set by `stopServer()`
- Dot shows green briefly
- Next interval: returns `{state: "inactive"}` → `serverState` becomes `"inactive"` → dot turns gray

## Fix

Change `startPolling` to only update `serverState` when the poll result reaches the target or a terminal state:

```ts
if (res.state === targetState) {
    serverState.value = res.state;
    stopPolling();
} else if (res.state === 'failed') {
    serverState.value = res.state;
    stopPolling();
    if (targetState === 'inactive') crashed.value = true;
} else if (elapsed >= timeout) {
    if (targetState === 'inactive') {
        stopTimedOut.value = true;
    }
    stopPolling();
}
```

