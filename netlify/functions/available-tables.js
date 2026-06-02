exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { date, time } = event.queryStringParameters;
  if (!date || !time) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing date or time' }) };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch all tables
  const { data: tables, error: tablesError } = await supabase
    .from('tables')
    .select('*')
    .order('order', { ascending: true });

  if (tablesError) {
    return { statusCode: 500, body: JSON.stringify({ error: tablesError.message }) };
  }

  // Fetch reservations for that date/time (within 2-hour window)
  const startTime = time;
  const endTime = `${parseInt(time.split(':')[0]) + 2}:${time.split(':')[1]}`;

  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select(`
      id,
      reservation_date,
      reservation_time,
      reservation_tables (table_id)
    `)
    .eq('reservation_date', date)
    .gte('reservation_time', startTime)
    .lt('reservation_time', endTime)
    .not('status', 'eq', 'cancelled');

  if (resError) {
    return { statusCode: 500, body: JSON.stringify({ error: resError.message }) };
  }

  const bookedTableIds = new Set();
  reservations.forEach(res => {
    res.reservation_tables?.forEach(rt => bookedTableIds.add(rt.table_id));
  });

  const availableTables = tables.filter(t => !bookedTableIds.has(t.id));

  return {
    statusCode: 200,
    body: JSON.stringify({ available: availableTables, all: tables }),
  };
};