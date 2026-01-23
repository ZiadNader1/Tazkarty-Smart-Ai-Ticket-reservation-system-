export const environment = {
  production: true,
  apiUrl: 'https://tazkarty-backend.onrender.com/api',
  socketUrl: 'https://tazkarty-backend.onrender.com',
  stripePublishableKey: 'pk_test_TYooMQauvdEDq54NiTphI7jx',

  features: {
    enableAI: true,
    enableNotifications: true,
    enableAnalytics: true,
  },
  seatLockDuration: 5 * 60 * 1000,
  maxSeatsPerBooking: 10,
};