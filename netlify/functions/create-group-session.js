exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { hostEmail, reservationData } = JSON.parse(event.body);
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const { data, error } = await supabase
    .from('group_sessions')
    .insert([{ token, host_email: hostEmail, reservation_data: reservationData }])
    .select()
    .single();
  
  if (error) return { statusCode: 500, body: JSON.stringify({ error }) };
  const link = `https://verandacafe.netlify.app/join?token=${token}`;
  return { statusCode: 200, body: JSON.stringify({ token, link }) };
};