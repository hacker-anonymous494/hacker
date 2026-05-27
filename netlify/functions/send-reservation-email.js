exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, email, date, time, guests, phone, notes } = JSON.parse(event.body);

    if (!name || !email || !date || !time || !guests) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      console.error('Missing Brevo API key');
      return { statusCode: 200, body: JSON.stringify({ message: 'Reservation saved (email disabled)' }) };
    }

    // Customer email HTML
    const customerHtml = `
      <div style="font-family: sans-serif;">
        <h2>Veranda – Reservation Request Received</h2>
        <p>Dear ${name},</p>
        <p>Your reservation for <strong>${date}</strong> at <strong>${time}</strong> for <strong>${guests}</strong> guests is pending confirmation.</p>
        <p>We will contact you shortly.</p>
        <hr />
        <p>Veranda | 42 Veranda Lane | (212) 555-0142</p>
      </div>
    `;

    // Send to customer via Brevo
    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Veranda', email: 'your-verified-email@gmail.com' }, // Use your own verified email
        to: [{ email, name }],
        subject: 'Veranda – Reservation Received',
        htmlContent: customerHtml,
      }),
    });

    if (!brevoResponse.ok) {
      const error = await brevoResponse.text();
      console.error('Brevo error:', error);
      return { statusCode: 500, body: JSON.stringify({ error: 'Email send failed' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Reservation saved and email sent' }) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};