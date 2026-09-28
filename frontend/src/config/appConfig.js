const rawDemoUserId = import.meta.env.VITE_DEMO_USER_ID?.trim() || '1'
const demoUserId = Number(rawDemoUserId)

if (!Number.isInteger(demoUserId) || demoUserId <= 0) {
  throw new Error('VITE_DEMO_USER_ID must be a positive integer')
}

export const APP_CONFIG = {
  demoUserId,
}
