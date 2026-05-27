import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Save, X, Upload, Calendar as CalendarIcon, Clock, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EventsManager() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    poster_url: '',
    ticket_link: '',
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (event = null) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        name: event.name,
        description: event.description || '',
        date: event.date?.split('T')[0] || '',
        time: event.time || '20:00',
        poster_url: event.poster_url || '',
        ticket_link: event.ticket_link || '',
      })
    } else {
      setEditingEvent(null)
      setFormData({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: '20:00',
        poster_url: '',
        ticket_link: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `event-${Date.now()}.${fileExt}`
      const { error } = await supabase.storage
        .from('event-posters')
        .upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('event-posters')
        .getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, poster_url: publicUrl }))
      toast.success('Poster uploaded')
    } catch (error) {
      console.error(error)
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...formData,
      date: formData.date,
    }
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingEvent.id)
        if (error) throw error
        toast.success('Event updated')
      } else {
        const { error } = await supabase.from('events').insert([payload])
        if (error) throw error
        toast.success('Event added')
      }
      setIsModalOpen(false)
      fetchEvents()
    } catch (error) {
      console.error(error)
      toast.error('Save failed')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      toast.error('Delete failed')
    } else {
      toast.success('Deleted')
      fetchEvents()
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Events Manager</h1>
        <button onClick={() => openModal()} className="btn-primary py-2 px-4 text-sm">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-smoke-400">No events yet. Create your first event!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <div key={event.id} className="glass rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {event.poster_url && <img src={event.poster_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{event.name}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-smoke-400">
                    <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(event.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {event.time}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(event)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(event.id)} className="p-1.5 text-red-400 hover:bg-red-400/10 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-smoke-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-smoke-900 p-4 border-b border-white/10 flex justify-between items-center">
                <h2 className="font-heading text-xl">{editingEvent ? 'Edit Event' : 'New Event'}</h2>
                <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm mb-1">Event Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} rows="3" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-1">Date *</label>
                    <input type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Time</label>
                    <input type="time" value={formData.time} onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Poster Image</label>
                  <div className="flex gap-3 items-center">
                    {formData.poster_url && <img src={formData.poster_url} alt="preview" className="w-16 h-16 object-cover rounded-lg" />}
                    <label className="btn-outline py-2 px-3 text-xs cursor-pointer">
                      <Upload className="w-4 h-4 inline mr-1" /> Upload
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                    {uploading && <span className="text-xs">Uploading...</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">Ticket Link (optional)</label>
                  <div className="flex gap-2">
                    <LinkIcon className="w-4 h-4 text-smoke-400 self-center" />
                    <input type="url" value={formData.ticket_link} onChange={e => setFormData(prev => ({ ...prev, ticket_link: e.target.value }))} className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg" placeholder="https://..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline py-2 px-4">Cancel</button>
                  <button type="submit" className="btn-primary py-2 px-4"><Save className="w-4 h-4" /> Save</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}