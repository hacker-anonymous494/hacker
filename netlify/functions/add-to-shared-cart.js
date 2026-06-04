exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, item, quantity, guestEmail } = JSON.parse(event.body);
    if (!token || !item || !quantity || !guestEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    // Find the group session by token
    const { data: session, error: sessionError } = await supabase
      .from('group_sessions')
      .select('*')
      .eq('token', token)
      .single();

    if (sessionError || !session) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    const sessionItems = Array.isArray(session.items) ? [...session.items] : [];
    const existingIndex = sessionItems.findIndex(
      (i) => i.guest_email === guestEmail && i.menu_item_id === item.id
    );

    if (existingIndex >= 0) {
      sessionItems[existingIndex].quantity += quantity;
    } else {
      sessionItems.push({
        guest_email: guestEmail,
        menu_item_id: item.id,
        name: item.name,
        quantity,
        unit_price: item.price,
      });
    }

    const { error: updateError } = await supabase
      .from('group_sessions')
      .update({ items: sessionItems })
      .eq('id', session.id);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, items: sessionItems }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};