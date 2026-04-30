import { getUnitState, stopUnit } from '../../utils/systemd'

export default defineEventHandler(async () => {
  const state = await getUnitState('mcserver.service')

  if (state === 'inactive' || state === 'dead' || state === 'not-found') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Server is not running',
    })
  }

  await stopUnit('mcserver.service')
  return { success: true }
})
