const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token } = JSON.parse(event.body || '{}');
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!token) {
      // Log missing token
      await supabaseAdmin.from('security_events').insert([{
        event_type: 'recaptcha_failed',
        severity: 'warning',
        ip_address: event.headers['x-forwarded-for'] || event.headers['x-client-ip'] || 'unknown',
        details: { reason: 'missing_token' },
      }]).catch(err => console.warn('Security log failed:', err));

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

    if (!data.success) {
      // Log failed verification
      await supabaseAdmin.from('security_events').insert([{
        event_type: 'recaptcha_failed',
        severity: 'warning',
        ip_address: event.headers['x-forwarded-for'] || event.headers['x-client-ip'] || 'unknown',
        details: { error_codes: data['error-codes'] },
      }]).catch(err => console.warn('Security log failed:', err));
    }

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