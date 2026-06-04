import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function JoinGroup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [session, setSession] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [myItems, setMyItems] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('group_sessions')
        .select('*')
        .eq('token', token)
        .single();
      if (error) {
        toast.error('Invalid or expired group link');
        setLoading(false);
        return;
      }
      setSession(data);
      // Load menu
      const { data: menu } = await supabase.from('menu_items').select('*');
      setMenuItems(menu || []);
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const addItemToSession = async (menuItem) => {
    if (!guestEmail) {
      toast.error('Enter your email first');
      return;
    }
    // Update local cart
    const existing = myItems.find(i => i.menu_item_id === menuItem.id);
    let newMyItems;
    if (existing) {
      newMyItems = myItems.map(i =>
        i.menu_item_id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newMyItems = [...myItems, {
        guest_email: guestEmail,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unit_price: menuItem.price,
      }];
    }
    setMyItems(newMyItems);
  };

  const removeItem = (menuItemId) => {
    setMyItems(myItems.filter(i => i.menu_item_id !== menuItemId));
  };

  const updateQuantity = (menuItemId, delta) => {
    setMyItems(myItems.map(i => {
      if (i.menu_item_id === menuItemId) {
        const newQty = i.quantity + delta;
        return newQty > 0 ? { ...i, quantity: newQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const submitOrder = async () => {
    if (myItems.length === 0) {
      toast.error('No items to submit');
      return;
    }
    // Merge my items into session.items (preserving other guests)
    const currentItems = session.items || [];
    // Remove previous items from this guest (if any)
    const filtered = currentItems.filter(i => i.guest_email !== guestEmail);
    const updatedItems = [...filtered, ...myItems];
    const { error } = await supabase
      .from('group_sessions')
      .update({ items: updatedItems })
      .eq('token', token);
    if (error) {
      toast.error('Failed to submit');
    } else {
      setSubmitted(true);
      toast.success('Your order submitted! Host will see it.');
    }
  };

  if (!token) return <div className="pt-28 text-center">No group token provided</div>;
  if (loading) return <div className="pt-28 text-center">Loading group session...</div>;
  if (!session) return <div className="pt-28 text-center">Group session not found or expired</div>;

  if (submitted) {
    return (
      <div className="pt-28 text-center">
        <h2 className="font-display text-2xl">Order Submitted!</h2>
        <p className="text-smoke-300 mt-2">The host will now see your items and pay for the group.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom max-w-5xl">
        <h1 className="font-display text-3xl">Join {session.host_email}'s Group</h1>
        <p className="text-smoke-400 mb-6">{session.reservation_data.date} at {session.reservation_data.time}</p>

        <div className="glass p-4 rounded-xl mb-6">
          <label className="block text-sm mb-1">Your email</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 rounded-lg"
            placeholder="you@example.com"
            disabled={submitted}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-heading text-xl mb-4">Menu</h2>
            <div className="space-y-3">
              {menuItems.map(item => (
                <div key={item.id} className="glass p-3 rounded-xl flex justify-between items-center">
                  <div>
                    <h3>{item.name}</h3>
                    <p className="text-sm text-amber-400">${item.price}</p>
                  </div>
                  <button onClick={() => addItemToSession(item)} className="btn-primary py-1 px-3 text-sm">+ Add</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-heading text-xl mb-4">Your Items</h2>
            {myItems.length === 0 ? (
              <p className="text-smoke-400">No items added yet.</p>
            ) : (
              <div className="space-y-2">
                {myItems.map(item => (
                  <div key={item.menu_item_id} className="glass p-2 rounded-lg flex justify-between items-center">
                    <div>
                      <span>{item.name} x{item.quantity}</span>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => updateQuantity(item.menu_item_id, -1)} className="text-xs text-red-400">-</button>
                        <button onClick={() => updateQuantity(item.menu_item_id, 1)} className="text-xs text-green-400">+</button>
                        <button onClick={() => removeItem(item.menu_item_id)} className="text-xs text-gray-400">Remove</button>
                      </div>
                    </div>
                    <span className="text-amber-400">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 font-bold flex justify-between">
                  <span>Your total</span>
                  <span className="text-amber-400">${myItems.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</span>
                </div>
                <button onClick={submitOrder} className="btn-primary w-full mt-4">Submit My Order</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}