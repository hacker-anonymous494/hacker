exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Method Not Allowed' };
  const { date, time } = event.queryStringParameters;
  if (!date || !time) return { statusCode: 400, body: JSON.stringify({ error: 'Missing date or time' }) };

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

  // Get all tables
  const { data: allTables, error: tablesError } = await supabase.from('tables').select('*').order('order');
  if (tablesError) return { statusCode: 500, body: JSON.stringify({ error: tablesError.message }) };

  // Get confirmed reservations for that date
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('id')
    .eq('reservation_date', date)
    .eq('status', 'confirmed');
  if (resError) return { statusCode: 500, body: JSON.stringify({ error: resError.message }) };

  // Find taken table IDs
  let takenTableIds = new Set();
  if (reservations && reservations.length > 0) {
    const reservationIds = reservations.map(r => r.id);
    const { data: taken, error: rtError } = await supabase
      .from('reservation_tables')
      .select('table_id')
      .in('reservation_id', reservationIds);
    if (!rtError && taken) taken.forEach(t => takenTableIds.add(t.table_id));
  }

  // Filter: not taken AND not temporarily unavailable
  const available = allTables.filter(t => !takenTableIds.has(t.id) && !t.is_temporarily_unavailable);

  return {
    statusCode: 200,
    body: JSON.stringify({ available, all: allTables }),
  };
};