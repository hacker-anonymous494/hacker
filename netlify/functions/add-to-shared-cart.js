exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { token, item, quantity, guestEmail } = JSON.parse(event.body);
    if (!token || !item || !quantity) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    // Find the order by token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id')
      .eq('group_token', token)
      .single();

    if (orderError || !order) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Invalid or expired token' }) };
    }

    // Check if this guest already has a contributor record
    let { data: contributor, error: contribError } = await supabase
      .from('order_contributors')
      .select('*')
      .eq('order_id', order.id)
      .eq('guest_email', guestEmail)
      .maybeSingle();

    let updatedItems = [];
    if (contributor) {
      // Update existing contributor's items
      updatedItems = contributor.items;
      const existingIndex = updatedItems.findIndex(i => i.menu_item_id === item.id);
      if (existingIndex >= 0) {
        updatedItems[existingIndex].quantity += quantity;
      } else {
        updatedItems.push({
          menu_item_id: item.id,
          name: item.name,
          quantity,
          unit_price: item.price,
        });
      }
      const { error: updateError } = await supabase
        .from('order_contributors')
        .update({ items: updatedItems })
        .eq('id', contributor.id);
      if (updateError) throw updateError;
    } else {
      // Create new contributor
      updatedItems = [{
        menu_item_id: item.id,
        name: item.name,
        quantity,
        unit_price: item.price,
      }];
      const { error: insertError } = await supabase
        .from('order_contributors')
        .insert([{
          order_id: order.id,
          guest_email: guestEmail,
          token_used: token,
          items: updatedItems,
        }]);
      if (insertError) throw insertError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, items: updatedItems }),
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};