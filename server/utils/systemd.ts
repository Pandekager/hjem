import * as dbus from 'dbus-next'

let bus: dbus.MessageBus | null = null
let managerInterface: any = null

async function getBus(): Promise<dbus.MessageBus> {
  if (!bus) {
    bus = dbus.systemBus()
  }
  return bus
}

async function getManager(): Promise<any> {
  if (!managerInterface) {
    const b = await getBus()
    const proxy = await b.getProxyObject(
      'org.freedesktop.systemd1',
      '/org/freedesktop/systemd1',
    )
    managerInterface = proxy.getInterface('org.freedesktop.systemd1.Manager')
  }
  return managerInterface
}

/**
 * Get the current state of a systemd unit.
 * Returns one of: "active", "inactive", "activating", "deactivating", "failed"
 * Returns "not-found" if the unit does not exist or any error occurs.
 */
export async function getUnitState(unitName: string): Promise<string> {
  try {
    const b = await getBus()
    const unitPath = await getUnitPath(unitName)
    const proxy = await b.getProxyObject(
      'org.freedesktop.systemd1',
      unitPath,
    )
    const propsIface = proxy.getInterface('org.freedesktop.DBus.Properties')
    const activeState = await propsIface.Get(
      'org.freedesktop.systemd1.Unit',
      'ActiveState',
    )
    return String(activeState.value).toLowerCase()
  } catch {
    return 'not-found'
  }
}

async function getUnitPath(unitName: string): Promise<string> {
  const manager = await getManager()
  return manager.GetUnit(unitName)
}

/**
 * Start a systemd unit. Calls StartUnit with mode "replace".
 * Throws an error with a meaningful message if the operation fails.
 */
export async function startUnit(
  unitName: string,
): Promise<{ success: boolean }> {
  try {
    const manager = await getManager()
    await manager.StartUnit(unitName, 'replace')
    return { success: true }
  } catch (err: any) {
    throw new Error(
      `Failed to start unit "${unitName}": ${err?.message ?? err}`,
    )
  }
}

/**
 * Stop a systemd unit. Calls StopUnit with mode "replace".
 * Throws an error with a meaningful message if the operation fails.
 */
export async function stopUnit(
  unitName: string,
): Promise<{ success: boolean }> {
  try {
    const manager = await getManager()
    await manager.StopUnit(unitName, 'replace')
    return { success: true }
  } catch (err: any) {
    throw new Error(
      `Failed to stop unit "${unitName}": ${err?.message ?? err}`,
    )
  }
}
