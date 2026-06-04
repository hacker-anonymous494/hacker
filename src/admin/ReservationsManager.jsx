import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Search, Filter, X, Archive, Check, Ban, Eye, DollarSign, Calendar, Clock, Users, Phone, Mail } from 'lucide-react';

export default function ReservationsManager() {
  const [reservations, setReservations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [reservationTables, setReservationTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  const formatLocalTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get reservations (not hidden)
      const { data: resData, error: resErr } = await supabase
        .from('reservations')
        .select('*')
        .eq('hidden', false)
        .order('reservation_date', { ascending: false });
      if (resErr) throw resErr;
      setReservations(resData || []);

      // 2. Get orders
      const { data: ordData, error: ordErr } = await supabase.from('orders').select('*');
      if (ordErr) throw ordErr;
      setOrders(ordData || []);

      // 3. Get order_items and manually join with menu_items (most reliable)
      const { data: itemsData, error: itemsErr } = await supabase.from('order_items').select('*');
      if (itemsErr) throw itemsErr;
      const { data: menuData, error: menuErr } = await supabase.from('menu_items').select('*');
      if (menuErr) throw menuErr;

      const menuMap = new Map();
      menuData?.forEach(m => menuMap.set(m.id, m));

      const combinedItems = itemsData?.map(item => ({
        ...item,
        menu_items: menuMap.get(item.menu_item_id) || null,
      })) || [];
      setOrderItems(combinedItems);

      // 4. Get tables
      const { data: tablesData, error: tablesErr } = await supabase.from('tables').select('*');
      if (tablesErr) throw tablesErr;
      setTables(tablesData || []);

      // 5. Get reservation_tables
      const { data: rtData, error: rtErr } = await supabase.from('reservation_tables').select('*');
      if (rtErr) throw rtErr;
      setReservationTables(rtData || []);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reservations' }, (payload) => {
        toast.success(`New reservation from ${payload.new.name}!`);
        if (Notification.permission === 'granted') {
          new Notification(`Veranda: New reservation from ${payload.new.name}`, {
            body: `${payload.new.guests} guests on ${payload.new.reservation_date} at ${payload.new.reservation_time}`,
          });
        }
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservation_tables' }, () => fetchData())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) toast.error('Failed to update');
    else {
      toast.success(`Reservation ${newStatus}`);
      fetchData();
    }
  };

  const archiveReservation = async (id) => {
    const { error } = await supabase
      .from('reservations')
      .update({ hidden: true })
      .eq('id', id);
    if (error) toast.error('Archive failed');
    else {
      toast.success('Reservation archived');
      fetchData();
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast.success('Notifications enabled');
    } else {
      toast.error('Notifications blocked');
    }
  };

  const getOrderForReservation = (reservationId) => {
    return orders.find(o => o.reservation_id === reservationId);
  };

  const getOrderItemsForOrder = (orderId) => {
    return orderItems.filter(oi => oi.order_id === orderId);
  };

  const getTablesForReservation = (reservationId) => {
    const tableIds = reservationTables.filter(rt => rt.reservation_id === reservationId).map(rt => rt.table_id);
    return tables.filter(t => tableIds.includes(t.id));
  };

  const filteredReservations = reservations.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusColors = {
    pending: 'bg-amber-600/30 text-amber-400',
    confirmed: 'bg-green-600/30 text-green-400',
    cancelled: 'bg-red-600/30 text-red-400',
  };

  if (loading) return <div className="text-center py-10">Loading reservations...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl">Reservations Manager</h1>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-smoke-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {typeof window !== 'undefined' && 'Notification' in window && notificationPermission !== 'granted' && (
            <button onClick={requestNotificationPermission} className="btn-outline text-sm">🔔 Enable Desktop Notifications</button>
          )}
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">No reservations found</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredReservations.map(res => {
            const order = getOrderForReservation(res.id);
            const hasOrder = !!order;
            const isPaid = order?.status === 'paid';
            const assignedTables = getTablesForReservation(res.id);
            return (
              <div key={res.id} className="glass rounded-xl p-5 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <h3 className="font-heading text-xl">{res.name}</h3>
                      <span className={`badge text-xs ${statusColors[res.status] || 'bg-gray-600'}`}>{res.status}</span>
                      {hasOrder && (
                        <span className={`badge text-xs ${isPaid ? 'bg-green-600/30 text-green-400' : 'bg-amber-600/30 text-amber-400'}`}>
                          {isPaid ? 'Paid' : 'Payment pending'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-smoke-300">
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-400" /> {res.reservation_date}</div>
                      <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" /> {formatLocalTime(res.reservation_time)}</div>
                      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-amber-400" /> {res.guests} guests</div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" /> {res.phone}</div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-400" /> {res.email}</div>
                      {assignedTables.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span>📋 Tables:</span>
                          {assignedTables.map(t => <span key={t.id} className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{t.name}</span>)}
                        </div>
                      )}
                    </div>
                    {res.notes && <p className="mt-2 text-sm text-smoke-400">📝 {res.notes}</p>}
                    {hasOrder && order.total_amount && (
                      <div className="mt-2 text-sm font-medium text-amber-400">💰 Order total: ${order.total_amount}</div>
                    )}
                  </div>
                  <div className="flex gap-2 items-start">
                    <button onClick={() => { setSelectedReservation(res); setShowDetails(true); }} className="p-2 rounded-lg bg-amber-600/20 text-amber-400 hover:bg-amber-600/30">
                      <Eye className="w-4 h-4" />
                    </button>
                    {res.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(res.id, 'confirmed')} className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30" title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(res.id, 'cancelled')} className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30" title="Cancel">
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => archiveReservation(res.id)} className="p-2 rounded-lg bg-gray-600/20 text-gray-400 hover:bg-gray-600/30" title="Archive">
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedReservation && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
          <div className="bg-smoke-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-2xl">Reservation Details</h2>
              <button onClick={() => setShowDetails(false)} className="p-1 rounded-full hover:bg-white/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Name:</strong> {selectedReservation.name}</div>
                <div><strong>Email:</strong> {selectedReservation.email}</div>
                <div><strong>Phone:</strong> {selectedReservation.phone}</div>
                <div><strong>Guests:</strong> {selectedReservation.guests}</div>
                <div><strong>Date:</strong> {selectedReservation.reservation_date}</div>
                <div><strong>Time:</strong> {formatLocalTime(selectedReservation.reservation_time)}</div>
                <div><strong>Status:</strong> <span className={`badge ${statusColors[selectedReservation.status]}`}>{selectedReservation.status}</span></div>
                <div><strong>Tables:</strong> {getTablesForReservation(selectedReservation.id).map(t => t.name).join(', ') || 'None'}</div>
              </div>
              {selectedReservation.notes && <div><strong>Notes:</strong> {selectedReservation.notes}</div>}

              {/* Order details */}
              {(() => {
                const order = getOrderForReservation(selectedReservation.id);
                if (!order) return null;
                const items = getOrderItemsForOrder(order.id);
                return (
                  <div className="border-t border-white/10 pt-3">
                    <h3 className="font-heading text-lg mb-2">Pre-ordered Items</h3>
                    {items.length === 0 ? <p className="text-sm text-smoke-400">No items ordered</p> : (
                      <table className="w-full text-sm">
                        <thead className="border-b border-white/10">
                          <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id}>
                              <td>{item.menu_items?.name || 'Unknown'}</td>
                              <td>{item.quantity}</td>
                              <td>${item.unit_price}</td>
                              <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="border-t"><td colSpan="3" className="text-right font-bold">Grand total:</td><td className="font-bold text-amber-400">${order.total_amount}</td></tr>
                        </tbody>
                      </table>
                    )}
                    <div className="mt-2 text-sm"><strong>Payment:</strong> {order.paypal_order_id ? 'PayPal' : order.stripe_payment_intent_id ? 'Stripe' : 'Pending'} • <span className={order.status === 'paid' ? 'text-green-400' : 'text-amber-400'}>{order.status}</span></div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}