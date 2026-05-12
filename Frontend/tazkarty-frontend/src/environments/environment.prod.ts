export const environment = {
  production: true,
  apiUrl: 'https://tazkarty-smart-ai-ticket-reservation.onrender.com/api',
  socketUrl: 'https://tazkarty-smart-ai-ticket-reservation.onrender.com',
  uploadsUrl: 'https://tazkarty-smart-ai-ticket-reservation.onrender.com/uploads',
  stripePublishableKey: 'pk_test_TYooMQauvdEDq54NiTphI7jx',

  features: {
    enableAI: true,
    enableNotifications: true,
    enableAnalytics: true,
  },
  seatLockDuration: 5 * 60 * 1000,
  maxSeatsPerBooking: 10,
};