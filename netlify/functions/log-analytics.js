const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    await supabase.from('analytics_events').insert([{
      session_id: payload.session_id,
      event_type: payload.event_type,
      page_path: payload.page_path,
      duration_ms: payload.duration_ms,
      user_agent: event.headers['user-agent'] || '',
    }]);

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Analytics logging error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
