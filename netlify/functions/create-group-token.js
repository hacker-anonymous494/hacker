exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const { orderId, hostEmail } = JSON.parse(event.body);
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const token = Math.random().toString(36).substring(2, 15);
  const { error } = await supabase
    .from('orders')
    .update({ is_group_order: true, group_token: token, host_email: hostEmail })
    .eq('id', orderId);
  
  if (error) return { statusCode: 500, body: JSON.stringify({ error }) };
  return {
    statusCode: 200,
    body: JSON.stringify({ token, link: `https://Trifiliacafe.netlify.app/join?token=${token}` })
  };
};
