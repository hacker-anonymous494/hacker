import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { CalendarIcon, Clock, Users, User, Phone, Mail, MessageSquare, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const reservationSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  guests: z.number().min(1).max(20),
  date: z.string().min(1, 'Select a date'),
  time: z.string().min(1, 'Select a time'),
  notes: z.string().optional(),
})

export default function Reservations() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      guests: 2,
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
    }
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    try {
      // 1. Insert into Supabase
      const { error: dbError } = await supabase
        .from('reservations')
        .insert([{
          name: data.name,
          email: data.email,
          phone: data.phone,
          guests: data.guests,
          reservation_date: data.date,
          reservation_time: data.time,
          notes: data.notes || null,
          status: 'pending'
        }])

      if (dbError) throw dbError

      // 2. Call Netlify function to send confirmation email
      const response = await fetch('/.netlify/functions/send-reservation-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        console.warn('Email notification failed, but reservation saved.')
      }

      setIsSuccess(true)
      reset()
      toast.success('Reservation request sent! Check your email for confirmation.')
      
      // Auto hide success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    } catch (error) {
      console.error('Reservation error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate next 30 days for date picker
  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + 30)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Secure Your Spot</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Make a Reservation</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 mt-4">Reserve your table for an unforgettable evening of craft cocktails and wood‑fired pizza.</p>
        </div>

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-green-600/20 border border-green-600/40 rounded-xl flex items-center gap-3 text-green-400"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Reservation request received! We'll send a confirmation email shortly.</span>
          </motion.div>
        )}

        <div className="glass rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <User className="inline w-3.5 h-3.5 mr-1" /> Full Name *
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <Mail className="inline w-3.5 h-3.5 mr-1" /> Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="hello@example.com"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <Phone className="inline w-3.5 h-3.5 mr-1" /> Phone *
                </label>
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="(212) 555-0142"
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <Users className="inline w-3.5 h-3.5 mr-1" /> Number of Guests *
                </label>
                <input
                  type="number"
                  {...register('guests', { valueAsNumber: true })}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
                {errors.guests && <p className="text-red-400 text-xs mt-1">{errors.guests.message}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <CalendarIcon className="inline w-3.5 h-3.5 mr-1" /> Date *
                </label>
                <input
                  type="date"
                  {...register('date')}
                  min={today}
                  max={maxDateStr}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-body mb-2 text-smoke-200">
                  <Clock className="inline w-3.5 h-3.5 mr-1" /> Time *
                </label>
                <select
                  {...register('time')}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="17:00">5:00 PM</option>
                  <option value="17:30">5:30 PM</option>
                  <option value="18:00">6:00 PM</option>
                  <option value="18:30">6:30 PM</option>
                  <option value="19:00">7:00 PM</option>
                  <option value="19:30">7:30 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="20:30">8:30 PM</option>
                  <option value="21:00">9:00 PM</option>
                  <option value="21:30">9:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                </select>
                {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-body mb-2 text-smoke-200">
                <MessageSquare className="inline w-3.5 h-3.5 mr-1" /> Special Requests (allergies, occasions, etc.)
              </label>
              <textarea
                {...register('notes')}
                rows="3"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50 resize-none"
                placeholder="Any dietary restrictions or celebration notes..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Request Reservation'}
            </button>

            <p className="text-xs text-smoke-500 text-center mt-4">
              You will receive a confirmation email within 30 minutes. For immediate assistance, call (212) 555-0142.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}