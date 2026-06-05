import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Music, Ticket, Clock, ArrowRight } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents(mockEvents)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Live Entertainment</span>
          <h1 className="font-display text-4xl md:text-5xl mt-2 mb-4">Upcoming Events</h1>
          <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          <p className="text-smoke-300 max-w-2xl mx-auto mt-4">
            From live jazz to DJ nights – experience Trifilia after dark.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 glass rounded-2xl">
            <Music className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-smoke-400">No upcoming events scheduled. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl overflow-hidden group hover:shadow-amber transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-72 h-64 md:h-auto overflow-hidden">
                    <img
                      src={event.poster_url || '/event-placeholder.jpg'}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 p-6 md:p-8">
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{event.time || '8:00 PM'}</span>
                      </div>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl mb-2">{event.name}</h2>
                    <p className="text-smoke-300 mb-4">{event.description}</p>
                    {event.ticket_link ? (
                      <a
                        href={event.ticket_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 btn-primary py-2.5 px-5 text-sm"
                      >
                        <Ticket className="w-4 h-4" /> Get Tickets
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-2 text-smoke-400 text-sm">
                        <MapPin className="w-4 h-4" /> Free entry • First come, first served
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Recurring Events Section */}
        <div className="mt-16">
          <h2 className="font-display text-2xl md:text-3xl text-center mb-8">Weekly Happenings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass p-6 rounded-2xl text-center">
              <Music className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-heading text-xl">Jazz Nights</h3>
              <p className="text-smoke-400 text-sm">Every Thursday • 8–11pm</p>
              <p className="text-smoke-500 text-xs mt-2">Local jazz quartets</p>
            </div>
            <div className="glass p-6 rounded-2xl text-center">
              <Calendar className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-heading text-xl">Happy Hour</h3>
              <p className="text-smoke-400 text-sm">Mon–Fri • 5–7pm</p>
              <p className="text-smoke-500 text-xs mt-2">$8 cocktails • $6 wine</p>
            </div>
            <div className="glass p-6 rounded-2xl text-center">
              <Music className="w-8 h-8 text-amber-500 mx-auto mb-3" />
              <h3 className="font-heading text-xl">DJ Sets</h3>
              <p className="text-smoke-400 text-sm">Fri & Sat • 10pm–late</p>
              <p className="text-smoke-500 text-xs mt-2">House, disco, funk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const mockEvents = [
  {
    id: '1',
    name: 'Trifilia Grand Opening',
    description: 'Celebrate our launch with complimentary welcome cocktails and live jazz.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    time: '7:00 PM',
    poster_url: null,
    ticket_link: '#',
  },
]
