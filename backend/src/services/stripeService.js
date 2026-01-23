import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create Payment Intent (MOCKED)
 */
export const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {

  // Return a mock PaymentIntent object
  return {
    id: 'pi_mock_' + Math.random().toString(36).substr(2, 9),
    object: 'payment_intent',
    amount: Math.round(amount * 100),
    currency: currency,
    status: 'requires_payment_method', // Initial status usually
    client_secret: 'pi_mock_secret_' + Math.random().toString(36).substr(2, 9),
    metadata: metadata
  };
};

/**
 * Confirm Payment Intent (MOCKED)
 */
export const confirmPaymentIntent = async (paymentIntentId) => {

  // Return a mock succeeded PaymentIntent
  return {
    id: paymentIntentId,
    object: 'payment_intent',
    status: 'succeeded',
    client_secret: 'pi_mock_secret_confirmed',
    amount: 1000,
    currency: 'usd'
  };
};

/**
 * Create Refund
 */
export const createRefund = async (paymentIntentId, amount = null) => {
  try {
    const refundData = {
      payment_intent: paymentIntentId,
    };

    if (amount) {
      refundData.amount = Math.round(amount * 100);
    }

    const refund = await stripe.refunds.create(refundData);
    return refund;
  } catch (error) {
    console.error('Stripe Refund Error:', error);
    throw new Error(error.message);
  }
};

/**
 * Verify Webhook Signature
 */
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook Signature Verification Failed:', error);
    throw new Error('Invalid signature');
  }
};

export default stripe;