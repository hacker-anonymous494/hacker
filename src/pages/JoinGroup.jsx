import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinGroup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [session, setSession] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [guestItems, setGuestItems] = useState([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      // Fetch group session details
      const { data: sessionData } = await supabase
        .from('group_sessions')
        .select('id, host_email, reservation_data, items')
        .eq('token', token)
        .single();
      setSession(sessionData);
      setGuestItems(sessionData?.items || []);

      // Fetch menu items
      const { data: items } = await supabase.from('menu_items').select('*');
      setMenuItems(items || []);

      setLoading(false);
    };
    fetchData();
  }, [token]);

  const addToCart = async (item, quantity = 1) => {
    if (!guestEmail) {
      toast.error('Please enter your email first');
      return;
    }
    try {
      const res = await fetch('/.netlify/functions/add-to-shared-cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, item, quantity, guestEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state
      setGuestItems(data.items);
      toast.success(`Added ${item.name}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateQuantity = async (item, delta) => {
    const newQty = (item.quantity || 0) + delta;
    if (newQty <= 0) return;
    await addToCart(item, delta);
  };

  if (!token) return <div className="pt-28 text-center">Invalid group link</div>;
  if (loading) return <div className="pt-28 text-center">Loading group order...</div>;
  if (!session) return <div className="pt-28 text-center">Group order not found or expired</div>;

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom max-w-5xl">
        <h1 className="font-display text-3xl mb-2">Join {session.host_email}'s Group Order</h1>
        <p className="text-smoke-400 mb-6">Add your items – the host will pay once.</p>

        {!emailSubmitted ? (
          <div className="glass p-6 rounded-2xl mb-8">
            <label className="block text-sm mb-2">Enter your email to start ordering</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="flex-1 px-4 py-2 bg-white/5 rounded-xl"
                placeholder="your@email.com"
              />
              <button onClick={() => setEmailSubmitted(true)} className="btn-primary">Continue</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Menu items */}
              <div className="md:col-span-2">
                <h2 className="font-heading text-xl mb-4">Menu</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {menuItems.map((item) => (
                    <div key={item.id} className="glass p-3 rounded-xl flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-amber-400">${item.price}</p>
                      </div>
                      <button onClick={() => addToCart(item)} className="btn-primary py-1 px-3 text-sm">+ Add</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart */}
              <div className="md:col-span-1">
                <h2 className="font-heading text-xl mb-4 flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Your Items</h2>
                {guestItems.length === 0 ? (
                  <p className="text-smoke-400">No items added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {guestItems.map((item) => (
                      <div key={item.menu_item_id + '-' + item.guest_email} className="glass p-3 rounded-xl">
                        <div className="flex justify-between">
                          <span>{item.name}</span>
                          <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item, -1)} className="px-2 py-0.5 bg-white/10 rounded">-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item, 1)} className="px-2 py-0.5 bg-white/10 rounded">+</button>
                          </div>
                          <button onClick={() => addToCart(item, -item.quantity)} className="text-red-400 text-sm">Remove</button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-white/10">
                      <div className="flex justify-between font-bold">
                        <span>Your total</span>
                        <span className="text-amber-400">${guestItems.reduce((s, i) => s + i.quantity * i.unit_price, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-smoke-500 text-center mt-8">The host will pay for the entire order. You don't need to enter payment here.</p>
          </>
        )}
      </div>
    </div>
  );
}