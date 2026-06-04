import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import TableSelector from '@/components/reservation/TableSelector';
import OrderModal from '@/components/reservation/OrderModal';
import PayPalCheckout from '@/components/reservation/PayPalCheckout';
import { useOrderStore } from '@/store/orderStore';

const reservationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone required'),
  guests: z.number().min(1).max(20),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional(),
});

export default function Reservations() {
  const [step, setStep] = useState(1);
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [groupLink, setGroupLink] = useState('');
  const [groupSessionId, setGroupSessionId] = useState('');
  const [groupItems, setGroupItems] = useState([]);
  const [groupTotal, setGroupTotal] = useState(0);
  const [paypalPaymentId, setPaypalPaymentId] = useState(null);
  const { items, getTotal, clearCart } = useOrderStore();
  const totalAmount = getTotal();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guests: 2,
      date: new Date().toISOString().split('T')[0],
      time: '19:00'
    }
  });
  const date = watch('date');
  const time = watch('time');
  const guests = watch('guests');

  useEffect(() => {
    if (!groupSessionId) return;

    const fetchGroupItems = async () => {
      const { data } = await supabase
        .from('group_sessions')
        .select('items')
        .eq('id', groupSessionId)
        .single();

      if (data?.items) {
        setGroupItems(data.items);
        const total = data.items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
        setGroupTotal(total);
      }
    };

    fetchGroupItems();

    const channel = supabase
      .channel(`group-session-updates-${groupSessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'group_sessions',
        filter: `id=eq.${groupSessionId}`,
      }, (payload) => {
        const newItems = payload.new.items || [];
        setGroupItems(newItems);
        const total = newItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
        setGroupTotal(total);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupSessionId]);

  useEffect(() => {
    const handleGroupItemsLoaded = (event) => {
      const cartItems = event.detail || [];
      useOrderStore.setState({ items: cartItems });
      sessionStorage.setItem('veranda_cart', JSON.stringify(cartItems));
    };

    window.addEventListener('groupItemsLoaded', handleGroupItemsLoaded);
    return () => window.removeEventListener('groupItemsLoaded', handleGroupItemsLoaded);
  }, []);

  const handlePayPalSuccess = (paymentDetails) => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaypalPaymentId(paymentDetails.paymentId);
    toast.success('Payment successful! Completing reservation...');

    const formData = {
      name: watch('name'),
      email: watch('email'),
      phone: watch('phone'),
      guests: watch('guests'),
      date: watch('date'),
      time: watch('time'),
      notes: watch('notes'),
    };
    onSubmitReservation(formData, paymentDetails.paymentId);
  };

  const onSubmitReservation = async (data, directPaymentId = null) => {
    const usedPaymentId = directPaymentId || paypalPaymentId;
    const orderTotal = isGroupOrder && groupLink ? groupTotal : totalAmount;

    // Retrieve cart items from sessionStorage if not available in state
    let cartItems = items;
    if (cartItems.length === 0) {
      const savedCart = sessionStorage.getItem('veranda_cart');
      if (savedCart) {
        cartItems = JSON.parse(savedCart);
        console.log('Restored cart from sessionStorage:', cartItems);
      }
    }

    if (selectedTableIds.length === 0) {
      toast.error('Please select at least one table');
      setIsProcessingPayment(false);
      return;
    }

    if (orderTotal > 0 && !usedPaymentId) {
      toast.error('Please complete the payment first');
      setIsProcessingPayment(false);
      return;
    }

    // Save cart to sessionStorage before async operations
    sessionStorage.setItem('veranda_cart', JSON.stringify(cartItems));

    setIsSubmitting(true);
    try {
      // 1. Insert reservation
      const { data: reservation, error: resError } = await supabase
        .from('reservations')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          guests: data.guests,
          reservation_date: data.date,
          reservation_time: data.time,
          notes: data.notes || null,
          status: usedPaymentId ? 'confirmed' : 'pending',
        }])
        .select()
        .single();
      if (resError) throw resError;

      // 2. Lock tables (mark as unavailable)
      const { error: lockError } = await supabase
        .from('tables')
        .update({ is_temporarily_unavailable: true })
        .in('id', selectedTableIds);
      if (lockError) throw lockError;

      // 3. Link reservation to tables
      const tableLinks = selectedTableIds.map(tableId => ({
        reservation_id: reservation.id,
        table_id: tableId,
      }));
      const { error: linkError } = await supabase.from('reservation_tables').insert(tableLinks);
      if (linkError) throw linkError;

      // 4. Create order if items exist
      let order = null;
      if (cartItems.length > 0) {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert([{
            reservation_id: reservation.id,
            user_email: data.email,
            total_amount: orderTotal,
            paypal_order_id: usedPaymentId || null,
            stripe_payment_intent_id: null,
            status: usedPaymentId ? 'paid' : 'pending',
          }])
          .select()
          .single();
        if (orderError) throw orderError;
        order = orderData;

        // 5. Insert order items
        const orderItems = cartItems.map(item => ({
          order_id: order.id,
          menu_item_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        }));
        console.log('Inserting order items:', orderItems);
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
          console.error('Order items insert failed:', itemsError);
          throw itemsError;
        }

        // 6. Clear cart only after success
        clearCart();
        sessionStorage.removeItem('veranda_cart');

        if (isGroupOrder && order) {
          try {
            const res = await fetch('/.netlify/functions/create-group-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, hostEmail: data.email }),
            });
            const { link } = await res.json();
            toast.success(`Share this link with your group: ${link}`);
            try {
              await navigator.clipboard.writeText(link);
            } catch (clipboardErr) {
              console.warn('Clipboard copy failed', clipboardErr);
            }
          } catch (groupErr) {
            console.error('Group order token creation failed:', groupErr);
            toast.error('Group order link could not be created');
          }
        }
      }

      // 7. Send email notification (optional)
      try {
        await fetch('/.netlify/functions/send-reservation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            tables: selectedTableIds,
            orderTotal,
            orderItems: cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
          }),
        });
      } catch (emailErr) {
        console.warn(emailErr);
      }

      toast.success('Reservation confirmed! Check your email.');
      setStep(4);
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setIsProcessingPayment(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl md:text-5xl">Reserve a Table</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto mt-2" />
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 text-center pb-2 border-b-2 ${step >= s ? 'border-amber-500 text-amber-400' : 'border-white/10 text-smoke-500'}`}>
                {s === 1 ? 'Details' : s === 2 ? 'Select Table' : 'Order & Pay'}
              </div>
            ))}
          </div>

          <form id="reservation-form" onSubmit={handleSubmit(onSubmitReservation)}>
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm mb-1">Name *</label>
                    <input {...register('name')} className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email *</label>
                    <input {...register('email')} className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Phone *</label>
                    <input {...register('phone')} className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Guests *</label>
                    <input type="number" {...register('guests', { valueAsNumber: true })} className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                    {errors.guests && <p className="text-red-400 text-xs mt-1">{errors.guests.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Date *</label>
                    <input type="date" {...register('date')} min={today} max={maxDateStr} className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                    {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Time *</label>
                    <select {...register('time')} className="w-full px-4 py-2 bg-white/5 rounded-xl">
                      {['17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Special requests</label>
                  <textarea {...register('notes')} rows="2" className="w-full px-4 py-2 bg-white/5 rounded-xl" />
                </div>
                <button type="button" onClick={() => setStep(2)} className="btn-primary w-full">Continue to Table Selection</button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TableSelector date={date} time={time} guests={guests} onSelectTables={setSelectedTableIds} />
                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">Continue to Order</button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {!groupLink ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-heading text-xl">Your Order</h3>
                      <button type="button" onClick={() => setShowOrderModal(true)} className="flex items-center gap-1 text-amber-400 text-sm">
                        Add items
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="text-smoke-400 text-center py-4">No items added yet. Click "Add items" to pre-order.</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-white/10 pt-2 font-bold flex justify-between">
                          <span>Total</span>
                          <span className="text-amber-400">${totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass p-4 rounded-xl">
                    <h3 className="font-semibold">Combined Group Order:</h3>
                    {groupItems.length === 0 ? (
                      <p className="text-smoke-400 text-sm">No items added yet. Share the link!</p>
                    ) : (
                      <div className="space-y-1 max-h-60 overflow-y-auto mt-2">
                        {groupItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity} ({item.guest_email})</span>
                            <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 font-bold flex justify-between">
                          <span>Total to pay</span>
                          <span className="text-amber-400">${groupTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="groupOrder"
                    checked={isGroupOrder}
                    onChange={(e) => setIsGroupOrder(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="groupOrder">This is a group order – I will invite others to add items</label>
                </div>

                {isGroupOrder && !groupLink && (
                  <button
                    type="button"
                    onClick={async () => {
                      const reservationData = {
                        date: watch('date'),
                        time: watch('time'),
                        guests: watch('guests'),
                        tables: selectedTableIds,
                        name: watch('name'),
                        email: watch('email'),
                        phone: watch('phone'),
                      };

                      const hostItems = items.map(i => ({
                        guest_email: watch('email'),
                        menu_item_id: i.id,
                        name: i.name,
                        quantity: i.quantity,
                        unit_price: i.price,
                      }));

                      try {
                        const res = await fetch('/.netlify/functions/create-group-session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            hostEmail: watch('email'),
                            reservationData,
                            initialItems: hostItems,
                          }),
                        });
                        const data = await res.json();
                        if (data.link) {
                          setGroupLink(data.link);
                          setGroupSessionId(data.sessionId);
                          setGroupItems(hostItems);
                          setGroupTotal(hostItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0));
                          toast.success('Group link created! Share it with your friends.');
                          try {
                            await navigator.clipboard.writeText(data.link);
                          } catch (clipboardErr) {
                            console.warn('Clipboard copy failed', clipboardErr);
                          }
                        }
                      } catch (err) {
                        console.error('Group link creation failed', err);
                        toast.error('Could not create group link');
                      }
                    }}
                    className="btn-primary w-full"
                  >
                    Generate Group Link
                  </button>
                )}

                {groupLink && (
                  <div className="glass p-4 rounded-xl">
                    <p className="mb-2">Share this link with your group:</p>
                    <code className="block break-all text-sm bg-black/40 p-2 rounded">{groupLink}</code>
                    <div className="mt-4">
                      <h3 className="font-semibold">Combined Group Order:</h3>
                      {groupItems.length === 0 ? (
                        <p className="text-smoke-400 text-sm">No items added yet. Share the link!</p>
                      ) : (
                        <div className="space-y-1 max-h-60 overflow-y-auto mt-2">
                          {groupItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name} x{item.quantity} ({item.guest_email})</span>
                              <span>${(item.quantity * item.unit_price).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="border-t pt-2 font-bold flex justify-between">
                            <span>Total to pay</span>
                            <span className="text-amber-400">${groupTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const mergedMap = new Map();
                        groupItems.forEach(i => {
                          const existing = mergedMap.get(i.menu_item_id);
                          if (existing) {
                            existing.quantity += i.quantity;
                          } else {
                            mergedMap.set(i.menu_item_id, { ...i, quantity: i.quantity });
                          }
                        });
                        const cartItems = Array.from(mergedMap.values()).map(i => ({
                          id: i.menu_item_id,
                          name: i.name,
                          price: i.unit_price,
                          quantity: i.quantity,
                        }));
                        useOrderStore.setState({ items: cartItems });
                        window.dispatchEvent(new CustomEvent('groupItemsLoaded', { detail: cartItems }));
                      }}
                      className="btn-primary mt-4 w-full"
                      disabled={groupItems.length === 0}
                    >
                      Pay for Group (${groupTotal.toFixed(2)})
                    </button>
                  </div>
                )}

                {(!isGroupOrder || (isGroupOrder && groupLink && groupTotal > 0)) && (
                  <div className="border-t border-white/10 pt-4">
                    <label className="block text-sm font-body mb-3 text-smoke-200">Pay with PayPal</label>
                    <PayPalCheckout
                      amount={isGroupOrder ? groupTotal : totalAmount}
                      onSuccess={handlePayPalSuccess}
                      onError={(err) => toast.error(err.message || 'Payment failed')}
                      disabled={isProcessingPayment}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1">Back</button>
                  {totalAmount === 0 && (
                    <button type="submit" disabled={isSubmitting || isProcessingPayment} className="btn-primary flex-1">
                      {isSubmitting || isProcessingPayment ? 'Processing...' : 'Complete Reservation (Pay at Venue)'}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="font-heading text-2xl mb-2">Reservation Confirmed!</h2>
                <p className="text-smoke-300">We’ve sent a confirmation to your email. See you soon!</p>
              </div>
            )}
          </form>
        </div>
      </div>
      <OrderModal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} />
    </div>
  );
}