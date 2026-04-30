import { getUnitState, startUnit } from '~/server/utils/systemd'

export default defineEventHandler(async () => {
  const state = await getUnitState('mcserver.service')

  if (state === 'active' || state === 'activating') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Server is already running',
    })
  }

  await startUnit('mcserver.service')
  return { success: true }
})
