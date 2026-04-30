import { getUnitState } from '~/server/utils/systemd'

export default defineEventHandler(async () => {
  const state = await getUnitState('mcserver.service')
  return { state }
})
