const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Authenticate with the internal API secret
  const providedSecret = event.headers['x-api-key'];
  const validSecret = process.env.ANALYTICS_API_SECRET;
  if (!providedSecret || providedSecret !== validSecret) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  // 2. Parse query parameters
  const { start_date, end_date, table, format = 'csv' } = event.queryStringParameters || {};

  if (!start_date || !end_date || !table) {
    return { statusCode: 400, body: JSON.stringify({ 
      error: 'Missing required parameters: start_date, end_date, table (analytics_events or security_events)' 
    }) };
  }

  // Validate table name (prevent SQL injection)
  if (!['analytics_events', 'security_events'].includes(table)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid table name' }) };
  }

  // 3. Query Supabase (using service_role key for full access)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // you must add this to Netlify env
  );

  // Pagination: fetch all rows (limit 1000 per page, we'll loop)
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .gte('created_at', start_date)
      .lte('created_at', end_date)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error(error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Database query failed' }) };
    }
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRows.push(...data);
      page++;
      if (data.length < pageSize) hasMore = false;
    }
  }

  // 4. Return data in requested format
  if (format === 'json') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(allRows),
    };
  }

  // 5. Convert to CSV
  if (allRows.length === 0) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: 'No data found for this date range',
    };
  }

  // Helper to flatten nested objects and escape CSV
  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = Object.keys(allRows[0]);
  const csvRows = [
    headers.join(','),
    ...allRows.map(row => headers.map(h => escapeCsv(row[h])).join(','))
  ];
  const csv = csvRows.join('\n');

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/csv' },
    body: csv,
  };
};