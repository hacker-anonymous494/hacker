import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Check, X, Clock, Calendar as CalendarIcon, Users, Phone, Mail, MessageSquare, Filter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReservationsManager() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, confirmed, cancelled

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('reservation_date', { ascending: true })
        .order('reservation_time', { ascending: true })
      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
      toast.success(`Reservation ${newStatus}`)
      fetchReservations()
    } catch (error) {
      console.error(error)
      toast.error('Update failed')
    }
  }

  const filteredReservations = reservations.filter(res => {
    if (filter === 'all') return true
    return res.status === filter
  })

  const statusColors = {
    pending: 'bg-amber-600/30 text-amber-400',
    confirmed: 'bg-green-600/30 text-green-400',
    cancelled: 'bg-red-600/30 text-red-400',
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Reservations</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'all' ? 'bg-amber-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'pending' ? 'bg-amber-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredReservations.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-smoke-400">No reservations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((res) => (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading text-lg">{res.name}</h3>
                    <span className={`badge text-xs ${statusColors[res.status]}`}>{res.status}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex items-center gap-2 text-smoke-300">
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{res.reservation_date} at {res.reservation_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-smoke-300">
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>{res.guests} guests</span>
                    </div>
                    <div className="flex items-center gap-2 text-smoke-300">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{res.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-smoke-300">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      <span>{res.email}</span>
                    </div>
                  </div>
                  {res.notes && (
                    <div className="flex items-start gap-2 text-sm text-smoke-400 mt-2">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{res.notes}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {res.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(res.id, 'confirmed')}
                        className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
                        title="Confirm"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(res.id, 'cancelled')}
                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {res.status === 'confirmed' && (
                    <button
                      onClick={() => updateStatus(res.id, 'cancelled')}
                      className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}