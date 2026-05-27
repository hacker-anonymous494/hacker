// Netlify Function: Send reservation confirmation email
// Uses environment variables: RESEND_API_KEY (or any email service)

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { name, email, date, time, guests, phone, notes } = JSON.parse(event.body)

    // Basic validation
    if (!name || !email || !date || !time || !guests) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    // Example using Resend.com (free tier)
    // You'll need to add RESEND_API_KEY to Netlify environment variables
    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      console.warn('No email API key configured – skipping email send')
      return { statusCode: 200, body: JSON.stringify({ message: 'Reservation saved (email disabled)' }) }
    }

    const emailHtml = `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f06c12;">Veranda – Reservation Confirmation</h2>
        <p>Dear ${name},</p>
        <p>Thank you for choosing Veranda. Your reservation request has been received and is pending confirmation.</p>
        <h3>Reservation Details</h3>
        <ul>
          <li><strong>Date:</strong> ${date}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Guests:</strong> ${guests}</li>
          <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
          <li><strong>Special Requests:</strong> ${notes || 'None'}</li>
        </ul>
        <p>We will contact you within 30 minutes to confirm your booking.</p>
        <hr />
        <p style="font-size: 12px; color: #666;">Veranda | 42 Veranda Lane, New York, NY | (212) 555-0142</p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Veranda <reservations@verandabar.com>',
        to: [email],
        subject: 'Veranda – Reservation Request Received',
        html: emailHtml,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Email send failed' }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' }),
    }
  } catch (error) {
    console.error('Function error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}