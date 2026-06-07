exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const {
      name, email, date, time, guests, phone, notes,
      orderTotal, orderItems, paymentCompleted, paymentMethod, tables
    } = JSON.parse(event.body);

    if (!name || !email || !date || !time || !guests) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.warn('No email API key configured – skipping email send');
      return { statusCode: 200, body: JSON.stringify({ message: 'Reservation saved (email disabled)' }) };
    }

    // Helper to build order items HTML
    const buildOrderItemsHtml = () => {
      if (!orderItems || orderItems.length === 0) return '';
      let itemsHtml = '';
      itemsHtml += 'ItemQtyPriceTotal';
      orderItems.forEach(item => {
        const total = item.quantity * item.price;
        itemsHtml += `
          ${escapeHtml(item.name)}
          ${item.quantity}
          $${item.price.toFixed(2)}
          $${total.toFixed(2)}
        `;
      });
      itemsHtml += `
        Grand Total:
        $${orderTotal?.toFixed(2) || '0.00'}
      `;
      itemsHtml += '';
      return itemsHtml;
    };

    let subject, htmlContent;
    const baseStyles = `
      
      Veranda Restaurant
    `;
    const tableInfo = `
      **Date:** ${date}

      **Time:** ${time}

      **Guests:** ${guests}

      **Tables:** ${tables?.join(', ') || 'Assigned at arrival'}

      **Phone:** ${phone || 'Not provided'}

      **Notes:** ${notes || 'None'}

    `;

    if (paymentCompleted) {
      // Paid reservation – confirmation + receipt
      subject = `Veranda – Reservation Confirmed (Receipt)`;
      htmlContent = `${baseStyles}
        Dear ${name},

        Your reservation has been **CONFIRMED** and your payment of **$${orderTotal?.toFixed(2)}** via ${paymentMethod} has been received.

        **Reservation details:**

        ${tableInfo}
        **Your pre‑ordered items (receipt):**

        ${buildOrderItemsHtml()}
        We look forward to welcoming you. If you need to modify your reservation, please call us.

        
---

        Veranda | 42 Veranda Lane, New York, NY | (212) 555-0142

      
`;
    } else {
      // Cash reservation – pending confirmation
      subject = `Veranda – Reservation Request Received (Pending Confirmation)`;
      htmlContent = `${baseStyles}
        Dear ${name},

        Thank you for choosing Veranda. Your reservation request has been received and is **pending confirmation**.

        **Reservation details:**

        ${tableInfo}
        ${orderItems && orderItems.length > 0 ? `**Your pre‑ordered items (to be paid at venue):**

${buildOrderItemsHtml()}` : ''}
        We will contact you within 30 minutes to confirm your booking. If you do not hear from us, please call us.

        **Payment:** ${paymentMethod} (pay when you arrive)

        
---

        Veranda | 42 Veranda Lane, New York, NY | (212) 555-0142

      
`;
    }

    // Send email
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Veranda ',
        to: [email],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Email send failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Email sent successfully' }) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

// Helper to escape HTML special characters (prevent injection)
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}
