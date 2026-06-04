import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useEffect, useState } from 'react';

export default function PayPalCheckout({ amount, onSuccess, onError, disabled }) {
  const [clientId, setClientId] = useState(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    const id = import.meta.env.VITE_PAYPAL_CLIENT_ID;
    console.log('PayPal Client ID available?', id ? 'Yes (length: ' + id.length + ')' : 'No');
    if (!id || id === 'undefined' || id === 'null' || id.startsWith('{{')) {
      console.error('PayPal Client ID is missing or invalid.');
      setScriptError(true);
    } else {
      setClientId(id);
    }
  }, []);

  if (!amount || amount <= 0) return null;

  if (scriptError || !clientId) {
    return (
      <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg text-center">
        ⚠️ PayPal payment is temporarily unavailable. Please complete your reservation and pay at the venue.
      </div>
    );
  }

  const createOrder = async () => {
    try {
      const response = await fetch('/.netlify/functions/create-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency_code: 'USD' }),
      });
      const orderData = await response.json();
      if (!response.ok) throw new Error(orderData.error || 'Could not create order');
      return orderData.orderId;
    } catch (error) {
      console.error('Failed to create PayPal order:', error);
      onError?.(error);
      throw error;
    }
  };

  const onApprove = async (data) => {
    if (disabled) return;
    try {
      const response = await fetch('/.netlify/functions/capture-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });
      const captureData = await response.json();
      if (!response.ok) throw new Error(captureData.error || 'Could not capture payment');
      onSuccess?.({
        paymentId: captureData.captureId,
        orderId: captureData.orderId,
        totalAmount: captureData.totalAmount,
      });
    } catch (error) {
      console.error('Failed to capture PayPal payment:', error);
      onError?.(error);
    }
  };

  return (
    <PayPalScriptProvider
      options={{
        'client-id': clientId,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        disabled={disabled}
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          console.error('PayPal Button Error:', err);
          onError?.(err);
        }}
        onCancel={() => onError?.(new Error('Payment was cancelled'))}
      />
    </PayPalScriptProvider>
  );
}