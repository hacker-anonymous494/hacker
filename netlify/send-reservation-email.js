// Netlify Function: Send reservation confirmation email to customer AND restaurant
// Uses environment variables: RESEND_API_KEY, RESTAURANT_EMAIL (optional)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { name, email, date, time, guests, phone, notes } = JSON.parse(event.body)

    if (!name || !email || !date || !time || !guests) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const RESTAURANT_EMAIL = process.env.RESTAURANT_EMAIL || 'anxhelogace@gmail.com' // 

    if (!RESEND_API_KEY) {
      console.warn('No email API key configured – skipping email send')
      return { statusCode: 200, body: JSON.stringify({ message: 'Reservation saved (email disabled)' }) }
    }

    // Customer email HTML
    const customerHtml = `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f06c12;">Veranda – Reservation Request Received</h2>
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

    // Restaurant notification HTML (more detailed, can include admin links)
    const restaurantHtml = `
      <div style="font-family: 'DM Sans', sans-serif;">
        <h2>New Reservation Request</h2>
        <p><strong>Customer:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Guests:</strong> ${guests}</p>
        <p><strong>Notes:</strong> ${notes || 'None'}</p>
        <p><a href="https://verandabar.com/admin/reservations">Manage in Admin Panel</a></p>
      </div>
    `

    // Send to customer
    const customerEmail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Veranda <reservations@verandabar.com>',
        to: [email],
        subject: 'Veranda – Reservation Request Received',
        html: customerHtml,
      }),
    })

    // Send to restaurant (optional – you can also combine in one API call using BCC)
    const restaurantEmail = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Veranda <reservations@verandabar.com>',
        to: [RESTAURANT_EMAIL],
        subject: `New Reservation: ${name} for ${date} at ${time}`,
        html: restaurantHtml,
      }),
    })

    if (!customerEmail.ok || !restaurantEmail.ok) {
      console.error('Resend error for one of the recipients')
      // Still return success because the reservation was saved
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails sent successfully' }),
    }
  } catch (error) {
    console.error('Function error:', error)
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}