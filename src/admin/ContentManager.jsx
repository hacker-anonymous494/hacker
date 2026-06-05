import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Save, Clock, Globe, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContentManager() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openingHours, setOpeningHours] = useState({
    monday: { open: '17:00', close: '00:00', closed: false },
    tuesday: { open: '17:00', close: '00:00', closed: false },
    wednesday: { open: '17:00', close: '00:00', closed: false },
    thursday: { open: '17:00', close: '00:00', closed: false },
    friday: { open: '17:00', close: '02:00', closed: false },
    saturday: { open: '17:00', close: '02:00', closed: false },
    sunday: { open: '16:00', close: '23:00', closed: false },
  })
  const [contactInfo, setContactInfo] = useState({
    address: '42 Trifilia Lane, New York, NY 10012',
    phone: '(212) 555-0142',
    email: 'hello@Trifiliabar.com',
    instagram: 'https://instagram.com/Trifiliabar',
    facebook: 'https://facebook.com/Trifiliabar',
    twitter: 'https://twitter.com/Trifiliabar',
  })
  const [homepageHero, setHomepageHero] = useState({
    title: 'Trifilia',
    subtitle: 'Wood‑fired artisan pizza & hand‑crafted cocktails',
    videoUrl: '/hero-video.mp4',
  })

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    setLoading(true)
    try {
      // Fetch opening hours
      const { data: hoursData } = await supabase
        .from('opening_hours')
        .select('*')
        .single()
      if (hoursData) {
        setOpeningHours(hoursData.hours || openingHours)
      }

      // Fetch homepage content
      const { data: homeData } = await supabase
        .from('homepage_content')
        .select('*')
        .single()
      if (homeData) {
        setHomepageHero({
          title: homeData.hero_title || 'Trifilia',
          subtitle: homeData.hero_subtitle || '',
          videoUrl: homeData.hero_video_url || '/hero-video.mp4',
        })
      }

      // Fetch contact info (could be from a 'settings' table)
      const { data: contactData } = await supabase
        .from('contact_info')
        .select('*')
        .single()
      if (contactData) {
        setContactInfo(contactData)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHoursChange = (day, field, value) => {
    setOpeningHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }))
  }

  const handleContactChange = (field, value) => {
    setContactInfo(prev => ({ ...prev, [field]: value }))
  }

  const handleHomepageChange = (field, value) => {
    setHomepageHero(prev => ({ ...prev, [field]: value }))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      // Save opening hours
      await supabase
        .from('opening_hours')
        .upsert({ id: 1, hours: openingHours }, { onConflict: 'id' })

      // Save homepage content
      await supabase
        .from('homepage_content')
        .upsert({
          id: 1,
          hero_title: homepageHero.title,
          hero_subtitle: homepageHero.subtitle,
          hero_video_url: homepageHero.videoUrl,
        }, { onConflict: 'id' })

      // Save contact info
      await supabase
        .from('contact_info')
        .upsert({ id: 1, ...contactInfo }, { onConflict: 'id' })

      toast.success('Content saved successfully')
    } catch (error) {
      console.error(error)
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-2xl">Content Manager</h1>
        <button onClick={saveAll} disabled={saving} className="btn-primary py-2 px-4 text-sm">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Opening Hours Section */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Opening Hours</h2>
          <div className="space-y-3">
            {Object.entries(openingHours).map(([day, hours]) => (
              <div key={day} className="flex flex-wrap items-center gap-3">
                <span className="w-28 capitalize font-medium">{day}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!hours.closed} onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)} />
                  Open
                </label>
                {!hours.closed && (
                  <>
                    <input type="time" value={hours.open} onChange={(e) => handleHoursChange(day, 'open', e.target.value)} className="px-2 py-1 bg-white/5 border border-white/10 rounded" />
                    <span>–</span>
                    <input type="time" value={hours.close} onChange={(e) => handleHoursChange(day, 'close', e.target.value)} className="px-2 py-1 bg-white/5 border border-white/10 rounded" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Homepage Hero Section */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-amber-500" /> Homepage Hero</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Hero Title</label>
              <input type="text" value={homepageHero.title} onChange={(e) => handleHomepageChange('title', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm mb-1">Hero Subtitle</label>
              <input type="text" value={homepageHero.subtitle} onChange={(e) => handleHomepageChange('subtitle', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm mb-1">Background Video URL (optional)</label>
              <input type="text" value={homepageHero.videoUrl} onChange={(e) => handleHomepageChange('videoUrl', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" placeholder="/hero-video.mp4" />
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="glass rounded-xl p-6">
          <h2 className="font-heading text-xl mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-amber-500" /> Contact Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Address</label>
              <input type="text" value={contactInfo.address} onChange={(e) => handleContactChange('address', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input type="text" value={contactInfo.phone} onChange={(e) => handleContactChange('phone', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input type="email" value={contactInfo.email} onChange={(e) => handleContactChange('email', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1 flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</label>
                <input type="url" value={contactInfo.instagram} onChange={(e) => handleContactChange('instagram', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm mb-1 flex items-center gap-1"><Facebook className="w-3 h-3" /> Facebook</label>
                <input type="url" value={contactInfo.facebook} onChange={(e) => handleContactChange('facebook', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm mb-1 flex items-center gap-1"><Twitter className="w-3 h-3" /> Twitter</label>
                <input type="url" value={contactInfo.twitter} onChange={(e) => handleContactChange('twitter', e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
