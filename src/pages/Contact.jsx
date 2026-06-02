import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, Twitter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export default function Contact() {
  const [contactInfo, setContactInfo] = useState({
    address: '42 Veranda Lane, New York, NY 10012',
    phone: '(212) 555-0142',
    email: 'hello@verandabar.com',
    instagram: 'https://instagram.com/verandabar',
    facebook: 'https://facebook.com/verandabar',
    twitter: 'https://twitter.com/verandabar',
    hours: 'Mon–Thu 5pm–12am, Fri–Sat 5pm–2am, Sun 4pm–11pm',
  })
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
  })

  useEffect(() => {
    fetchContactInfo()
  }, [])

  const fetchContactInfo = async () => {
    const { data, error } = await supabase
      .from('contact_info')
      .select('*')
      .single()
    if (!error && data) {
      setContactInfo(data)
    }
    setLoading(false)
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to send')
      toast.success('Message sent! We’ll get back to you soon.')
      reset()
    } catch (error) {
      console.error('Contact error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactItems = [
    { icon: MapPin, title: 'Visit Us', details: contactInfo.address, link: `https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}` },
    { icon: Phone, title: 'Call Us', details: contactInfo.phone, link: `tel:${contactInfo.phone}` },
    { icon: Mail, title: 'Email', details: contactInfo.email, link: `mailto:${contactInfo.email}` },
    { icon: Clock, title: 'Hours', details: contactInfo.hours || 'Mon–Thu 5pm–12am, Fri–Sat 5pm–2am, Sun 4pm–11pm', link: null },
  ]

  const socials = [
    { icon: Instagram, label: 'Instagram', href: contactInfo.instagram },
    { icon: Facebook, label: 'Facebook', href: contactInfo.facebook },
    { icon: Twitter, label: 'Twitter', href: contactInfo.twitter },
  ]

  if (loading) return <div className="min-h-screen pt-28 flex justify-center">Loading...</div>

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Get in Touch</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Contact Us</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 max-w-2xl mx-auto mt-4">
            Have a question? Want to host a private event? Reach out – we’d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="glass rounded-2xl p-6 md:p-8">
            <h2 className="font-heading text-2xl mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">Name *</label>
                <input type="text" {...register('name')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50" placeholder="Your name" />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">Email *</label>
                <input type="email" {...register('email')} className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50" placeholder="you@example.com" />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">Message *</label>
                <textarea {...register('message')} rows="5" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 resize-none" placeholder="Tell us how we can help..." />
                {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message.message}</p>}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50">
                {isSubmitting ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </form>
          </div>

          {/* Contact Info & Map */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-2xl mb-4">Location & Hours</h2>
              <div className="space-y-4">
                {contactItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <item.icon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      {item.link ? (
                        <a href={item.link} target={item.link.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer" className="text-smoke-300 hover:text-amber-400 transition-colors">
                          {item.details}
                        </a>
                      ) : (
                        <p className="text-smoke-300">{item.details}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="glass rounded-2xl p-6">
              <h2 className="font-heading text-2xl mb-4">Follow Us</h2>
              <div className="flex gap-4">
                {socials.map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-white/5 border border-white/10 text-smoke-300 hover:text-amber-400 hover:bg-amber-600/10 transition-all" aria-label={social.label}>
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Google Maps Embed */}
            <div className="glass rounded-2xl overflow-hidden">
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.70512937933058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a316bb2c1e9%3A0xb8912c6c2e8e4b5!2s42+Veranda+Lane%2C+New+York%2C+NY+10012!5e0!3m2!1sen!2sus!4v1645123456789!5m2!1sen!2sus`}
                width="100%" height="250" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Veranda location map"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}