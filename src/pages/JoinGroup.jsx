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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      // Get group session
      const { data, error } = await supabase
        .from('group_sessions')
        .select('*')
        .eq('token', token)
        .single();
      if (error) {
        console.error('Failed to load group session:', error);
        toast.error('Invalid or expired group link');
        setLoading(false);
        return;
      }
      setSession(data);
      // Load menu items
      const { data: menu } = await supabase.from('menu_items').select('*');
      setMenuItems(menu || []);
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const addItemToSession = async (menuItem) => {
    if (!guestEmail) {
      toast.error('Please enter your email first');
      return;
    }
    // Update local cart
    const existing = myItems.find(i => i.menu_item_id === menuItem.id);
    let newItems;
    if (existing) {
      newItems = myItems.map(i =>
        i.menu_item_id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      newItems = [...myItems, {
        guest_email: guestEmail,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unit_price: menuItem.price,
      }];
    }
    setMyItems(newItems);
    
    // Persist to Supabase (update session.items)
    const allItems = [...(session.items || []), ...newItems]; // simplified merge
    const { error } = await supabase
      .from('group_sessions')
      .update({ items: allItems })
      .eq('token', token);
    if (error) toast.error('Failed to save item');
    else toast.success(`Added ${menuItem.name}`);
  };

  if (!token) return <div className="pt-28 text-center">No group token provided</div>;
  if (loading) return <div className="pt-28 text-center">Loading group session...</div>;
  if (!session) return <div className="pt-28 text-center">Group session not found or expired</div>;

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom max-w-5xl">
        <h1 className="font-display text-3xl mb-2">Join {session.host_email}'s Group Order</h1>
        <p className="text-smoke-400 mb-6">
          {session.reservation_data.date} at {session.reservation_data.time} · {session.reservation_data.guests} guests
        </p>
        
        <div className="glass p-4 rounded-xl mb-8">
          <label className="block text-sm mb-1">Your email (to identify your items)</label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 rounded-lg"
            placeholder="you@example.com"
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
                  <div key={item.menu_item_id} className="glass p-2 rounded-lg flex justify-between">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="text-amber-400">${(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}