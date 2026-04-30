import { getUnitState, killUnit } from '../../utils/systemd'

export default defineEventHandler(async () => {
  const state = await getUnitState('mcserver.service')
  if (state !== 'active' && state !== 'deactivating') {
    throw createError({ statusCode: 409, statusMessage: 'Server is not running' })
  }
  return await killUnit('mcserver.service')
})
