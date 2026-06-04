// netlify/functions/create-paypal-order.js
const fetch = require('node-fetch');

// Helper to get a PayPal access token
const getPayPalAccessToken = async () => {
  const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
};

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { amount, currency_code = 'USD' } = JSON.parse(event.body);
    
    if (!amount) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Amount is required' }) };
    }

    const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const accessToken = await getPayPalAccessToken();
    
    // Create the PayPal order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency_code,
              value: amount.toFixed(2),
            },
          },
        ],
      }),
    });

    const orderData = await response.json();
    
    if (!response.ok) {
      throw new Error(orderData.message || 'Failed to create PayPal order');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ orderId: orderData.id }),
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};