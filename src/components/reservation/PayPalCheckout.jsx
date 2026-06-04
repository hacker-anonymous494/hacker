// src/components/reservation/PayPalCheckout.jsx
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function PayPalCheckout({ amount, onSuccess, onError }) {
  // Don't render the button if there's no amount to pay
  if (!amount || amount <= 0) {
    return null;
  }

  // Function to create the order by calling our serverless function
  const createOrder = async () => {
    try {
      const response = await fetch('/.netlify/functions/create-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency_code: 'USD',
        }),
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || 'Could not create order');
      }

      // Return the order ID to the PayPal button
      return orderData.orderId;
    } catch (error) {
      console.error('Failed to create PayPal order:', error);
      onError?.(error);
      throw error;
    }
  };

  // Function to capture the payment after customer approves
  const onApprove = async (data) => {
    try {
      const response = await fetch('/.netlify/functions/capture-paypal-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      const captureData = await response.json();

      if (!response.ok) {
        throw new Error(captureData.error || 'Could not capture payment');
      }

      // Payment successful, call the onSuccess callback with capture details
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
        'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: 'USD',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          console.error('PayPal Button Error:', err);
          onError?.(err);
        }}
        onCancel={() => {
          console.log('Payment cancelled by user');
          onError?.(new Error('Payment was cancelled'));
        }}
      />
    </PayPalScriptProvider>
  );
}