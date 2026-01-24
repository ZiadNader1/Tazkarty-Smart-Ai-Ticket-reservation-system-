export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api',
  socketUrl: 'http://localhost:5000',
  uploadsUrl: 'http://localhost:5000/uploads',
  stripePublishableKey: 'pk_test_YOUR_STRIPE_KEY_HERE', // Replace with your key
  features: {
    enableAI: true,
    enableNotifications: true,
    enableAnalytics: false,
  },
  seatLockDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
  maxSeatsPerBooking: 10,
};