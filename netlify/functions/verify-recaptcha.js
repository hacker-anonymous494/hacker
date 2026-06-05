exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');
    const secret = process.env.RECAPTCHA_SECRET_KEY;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Missing reCAPTCHA token' }),
      };
    }

    if (!secret) {
      console.error('Missing RECAPTCHA_SECRET_KEY');
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: 'reCAPTCHA secret not configured' }),
      };
    }

    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
      {
        method: 'POST',
      }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: data.success }),
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Internal server error' }),
    };
  }
};