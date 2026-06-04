// netlify/functions/capture-paypal-order.js
const fetch = require('node-fetch');

// Helper to get a PayPal access token (same as above)
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
    const { orderId } = JSON.parse(event.body);
    
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order ID is required' }) };
    }

    const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const accessToken = await getPayPalAccessToken();
    
    // Capture the approved PayPal order
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await response.json();
    
    if (!response.ok) {
      throw new Error(captureData.message || 'Failed to capture PayPal order');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        orderId: captureData.id,
        captureId: captureData.purchase_units[0]?.payments?.captures[0]?.id,
        status: captureData.status,
        totalAmount: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      }),
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};