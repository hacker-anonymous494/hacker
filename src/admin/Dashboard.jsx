import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Users, Calendar, Utensils, Image, TrendingUp, Clock } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalReservations: 0,
    pendingReservations: 0,
    totalMenuItems: 0,
    upcomingEvents: 0,
    galleryImages: 0,
  })
  const [recentReservations, setRecentReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      // Reservations count
      const { count: totalRes } = await supabase.from('reservations').select('*', { count: 'exact', head: true })
      const { count: pendingRes } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      
      // Menu items count
      const { count: menuCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true })
      
      // Events count (upcoming)
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString())
      
      // Gallery count
      const { count: galleryCount } = await supabase.from('gallery_images').select('*', { count: 'exact', head: true })
      
      // Recent reservations
      const { data: recent } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        totalReservations: totalRes || 0,
        pendingReservations: pendingRes || 0,
        totalMenuItems: menuCount || 0,
        upcomingEvents: eventsCount || 0,
        galleryImages: galleryCount || 0,
      })
      setRecentReservations(recent || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Reservations', value: stats.totalReservations, icon: Users, color: 'blue' },
    { title: 'Pending', value: stats.pendingReservations, icon: Clock, color: 'amber' },
    { title: 'Menu Items', value: stats.totalMenuItems, icon: Utensils, color: 'green' },
    { title: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: 'purple' },
    { title: 'Gallery Images', value: stats.galleryImages, icon: Image, color: 'pink' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl">Dashboard</h1>
        <p className="text-smoke-400">Welcome back to Trifilia admin panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-5 h-5 text-${card.color}-400`} />
              <span className="text-2xl font-bold">{card.value}</span>
            </div>
            <p className="text-sm text-smoke-400">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl">Recent Reservations</h2>
          <TrendingUp className="w-4 h-4 text-smoke-400" />
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-12 skeleton" />)}
          </div>
        ) : recentReservations.length === 0 ? (
          <p className="text-smoke-400 text-center py-8">No reservations yet.</p>
        ) : (
          <div className="space-y-3">
            {recentReservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium">{res.name}</p>
                  <p className="text-xs text-smoke-400">{res.reservation_date} at {res.reservation_time} • {res.guests} guests</p>
                </div>
                <span className={`badge text-xs ${
                  res.status === 'pending' ? 'bg-amber-600/30 text-amber-400' :
                  res.status === 'confirmed' ? 'bg-green-600/30 text-green-400' :
                  'bg-red-600/30 text-red-400'
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
