export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  socketUrl: 'https://your-production-api.com',
  stripePublishableKey: 'pk_live_YOUR_LIVE_STRIPE_KEY_HERE',
  features: {
    enableAI: true,
    enableNotifications: true,
    enableAnalytics: true,
  },
  seatLockDuration: 5 * 60 * 1000,
  maxSeatsPerBooking: 10,
};