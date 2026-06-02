import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useOrderStore } from '@/store/orderStore';

export default function OrderModal({ isOpen, onClose }) {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState('all');
  const { items, addItem, updateQuantity, getTotal } = useOrderStore();

  useEffect(() => {
    if (isOpen) {
      const fetchMenu = async () => {
        const { data: items } = await supabase.from('menu_items').select('*');
        const { data: cats } = await supabase.from('menu_categories').select('*');
        if (items) setMenuItems(items);
        if (cats) setCategories(cats);
      };
      fetchMenu();
    }
  }, [isOpen]);

  const filtered = activeCat === 'all' 
    ? menuItems 
    : menuItems.filter(i => i.category_id === activeCat);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-smoke-900 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-white/10">
          <h2 className="font-heading text-xl">Pre-order food & drinks</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2 p-4 overflow-x-auto border-b border-white/10">
          <button onClick={() => setActiveCat('all')} className={`px-3 py-1 rounded-full text-sm ${activeCat === 'all' ? 'bg-amber-600' : 'bg-white/10'}`}>All</button>
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)} className={`px-3 py-1 rounded-full text-sm ${activeCat === cat.id ? 'bg-amber-600' : 'bg-white/10'}`}>{cat.name}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.map(item => {
            const cartItem = items.find(i => i.id === item.id);
            return (
              <div key={item.id} className="glass rounded-xl p-3 flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-xs text-smoke-400">{item.description?.slice(0, 60)}</p>
                  <span className="text-amber-400 font-bold text-sm">${item.price}</span>
                </div>
                {cartItem ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, cartItem.quantity - 1)} className="p-1 rounded bg-white/10"><Minus className="w-4 h-4" /></button>
                    <span className="w-6 text-center">{cartItem.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, cartItem.quantity + 1)} className="p-1 rounded bg-white/10"><Plus className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => addItem(item)} className="btn-outline py-1 px-3 text-xs">Add</button>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Total:</span>
            <span className="text-amber-400 font-bold">${getTotal().toFixed(2)}</span>
          </div>
          <button onClick={onClose} className="btn-primary w-full py-2">Continue to Reservation</button>
        </div>
      </div>
    </div>
  );
}