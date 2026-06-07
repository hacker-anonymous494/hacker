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

    // Helper to build a proper HTML table for order items
    const buildOrderItemsHtml = () => {
      if (!orderItems || orderItems.length === 0) return '';
      let html = '<table style="width:100%; border-collapse:collapse; margin:16px 0;">';
      html += '<tr style="background:#f5f5f5;">' +
        '<th style="padding:8px; text-align:left;">Item</th>' +
        '<th style="padding:8px; text-align:center;">Qty</th>' +
        '<th style="padding:8px; text-align:right;">Price</th>' +
        '<th style="padding:8px; text-align:right;">Total</th>' +
        '</tr>';
      orderItems.forEach(item => {
        const total = item.quantity * item.price;
        html += `<tr style="border-bottom:1px solid #ddd;">
          <td style="padding:8px;">${escapeHtml(item.name)}</td>
          <td style="padding:8px; text-align:center;">${item.quantity}</td>
          <td style="padding:8px; text-align:right;">$${item.price.toFixed(2)}</td>
          <td style="padding:8px; text-align:right;">$${total.toFixed(2)}</td>
        </tr>`;
      });
      html += `<tr style="font-weight:bold; border-top:2px solid #333;">
        <td colspan="3" style="padding:8px; text-align:right;">Grand Total:</td>
        <td style="padding:8px; text-align:right;">$${orderTotal?.toFixed(2) || '0.00'}</td>
      </tr>`;
      html += '</table>';
      return html;
    };

    let subject, htmlContent;
    const tableInfo = `
      <p><strong>Date:</strong> ${date}<br/>
      <strong>Time:</strong> ${time}<br/>
      <strong>Guests:</strong> ${guests}<br/>
      <strong>Tables:</strong> ${tables?.join(', ') || 'Assigned at arrival'}<br/>
      <strong>Phone:</strong> ${phone || 'Not provided'}<br/>
      <strong>Notes:</strong> ${notes || 'None'}</p>
    `;

    if (paymentCompleted) {
      // PAID reservation – Confirmation + Receipt
      subject = `Veranda – Reservation Confirmed (Receipt)`;
      htmlContent = `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f06c12;">Veranda Restaurant</h2>
          <p>Dear ${name},</p>
          <p>Your reservation has been <strong style="color:green;">CONFIRMED</strong> and your payment of <strong>$${orderTotal?.toFixed(2)}</strong> via ${paymentMethod} has been received.</p>
          <h3>Reservation details:</h3>
          ${tableInfo}
          <h3>Your pre‑ordered items (receipt):</h3>
          ${buildOrderItemsHtml()}
          <p>We look forward to welcoming you. If you need to modify your reservation, please call us.</p>
          <hr />
          <p style="font-size:12px; color:#666;">Veranda | 42 Veranda Lane, New York, NY | (212) 555-0142</p>
        </div>
      `;
    } else {
      // CASH reservation – Pending confirmation
      subject = `Veranda – Reservation Request Received (Pending Confirmation)`;
      htmlContent = `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f06c12;">Veranda Restaurant</h2>
          <p>Dear ${name},</p>
          <p>Thank you for choosing Veranda. Your reservation request has been received and is <strong style="color:#d97706;">pending confirmation</strong>.</p>
          <h3>Reservation details:</h3>
          ${tableInfo}
          ${orderItems && orderItems.length > 0 ? `<h3>Your pre‑ordered items (to be paid at venue):</h3>${buildOrderItemsHtml()}` : ''}
          <p>We will contact you within 30 minutes to confirm your booking. If you do not hear from us, please call us.</p>
          <p><strong>Payment:</strong> ${paymentMethod} (pay when you arrive)</p>
          <hr />
          <p style="font-size:12px; color:#666;">Veranda | 42 Veranda Lane, New York, NY | (212) 555-0142</p>
        </div>
      `;
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Veranda <reservations@verandabar.com>',  // ✅ fixed: proper email address
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

// Helper to escape HTML special characters
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}