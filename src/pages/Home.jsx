import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { supabase } from '@/lib/supabase'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import { Calendar, Music, Coffee, Wine, ArrowRight, Star } from 'lucide-react'

import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [galleryImages, setGalleryImages] = useState([])
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [featuredRef, featuredInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  useEffect(() => {
    const fetchData = async () => {
      // Featured menu items (no nested select – we'll just get items)
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('featured', true)
        .limit(6)
      if (!itemsError && items) setFeaturedItems(items)

      // Upcoming events
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)
      if (!eventsError && events) setUpcomingEvents(events)

      // Gallery images
      const { data: gallery, error: galleryError } = await supabase
        .from('gallery_images')
        .select('*')
        .order('order', { ascending: true })
        .limit(6)
      if (!galleryError && gallery) setGalleryImages(gallery)
    }
    fetchData()
  }, [])

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-smoke-950/70 via-smoke-950/50 to-smoke-950 z-10" />
          <div className="absolute inset-0 bg-noise opacity-30 z-20" />
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080')] bg-cover bg-center z-0" />
        </div>

        <div className="relative z-30 container-custom text-center" ref={heroRef}>
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="mb-4">
              <span className="inline-block px-3 py-1 text-xs font-body tracking-wider uppercase bg-amber-500/20 text-amber-400 rounded-full backdrop-blur-sm">
                Est. 2025
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[1.1]">
              Veranda
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl text-smoke-200 max-w-2xl mx-auto mb-8 font-body">
              Wood‑fired artisan pizza & hand‑crafted cocktails in an intimate, lush escape.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Link to="/reservations" className="btn-primary">Reserve a Table</Link>
              <Link to="/menu" className="btn-outline">Explore Menu</Link>
            </motion.div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Items Section */}
      <section className="section-py bg-smoke-950" ref={featuredRef}>
        <div className="container-custom">
          <motion.div
            initial="hidden"
            animate={featuredInView ? "visible" : "hidden"}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.span variants={fadeUp} className="text-amber-500 font-accent text-sm tracking-widest uppercase">Signature Selections</motion.span>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-5xl mt-2 mb-4">Featured Delights</motion.h2>
            <motion.div variants={fadeUp} className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                animate={featuredInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="menu-card group"
              >
                <div className="relative h-56 overflow-hidden bg-smoke-800">
                  <img
                    src={item.image_url || 'https://placehold.co/600x400?text=Veranda'}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  {item.tags?.includes('vegan') && (
                    <span className="absolute top-3 left-3 badge bg-green-600/80 text-white border-none">Vegan</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-heading text-xl font-semibold">{item.name}</h3>
                    <span className="font-body text-amber-400 font-bold">${item.price}</span>
                  </div>
                  <p className="text-smoke-400 text-sm mb-3">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.allergens?.map((a, i) => (
                      <span key={i} className="text-2xs bg-white/5 px-2 py-0.5 rounded-full text-smoke-300">{a}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/menu" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors font-medium">
              View Full Menu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Events Carousel */}
      <section className="section-py bg-radial-amber relative overflow-hidden">
        <div className="absolute inset-0 bg-smoke-950/60" />
        <div className="container-custom relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Live & Vibes</span>
            <h2 className="font-display text-3xl md:text-5xl mt-2 mb-4">Upcoming Events</h2>
            <div className="w-20 h-0.5 bg-amber-500/50 mx-auto" />
          </div>

          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            spaceBetween={30}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 }
            }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            className="pb-12"
          >
            {upcomingEvents.map((event) => (
              <SwiperSlide key={event.id}>
                <div className="glass rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
                  <img src={event.poster_url || 'https://placehold.co/400x300?text=Event'} alt={event.name} className="w-full h-48 object-cover" />
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <h3 className="font-heading text-xl font-semibold mb-2">{event.name}</h3>
                    <p className="text-smoke-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                    {event.ticket_link && (
                      <a href={event.ticket_link} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 text-sm font-medium inline-flex items-center gap-1">
                        Get Tickets <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Two Column: About & Contact */}
      <section className="section-py">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Our Story</span>
              <h2 className="font-display text-3xl md:text-4xl mt-2 mb-5">A Place Where Flames Meet Craft</h2>
              <p className="text-smoke-300 mb-4">
                Veranda was born from a love of two things: the primal crackle of a wood‑fired oven and the artistry of a well‑shaken cocktail. 
                We blend the warmth of a rustic pizzeria with the sophistication of a modern cocktail bar.
              </p>
              <p className="text-smoke-300 mb-6">
                Our ingredients are locally sourced, our spirits are small‑batch, and our atmosphere is designed to transport you to a 
                lush rooftop terrace under the stars.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-medium">
                Discover More <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="glass p-5 rounded-2xl text-center">
                  <Coffee className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-heading text-lg">Artisan Coffee</h4>
                  <p className="text-sm text-smoke-400">Single-origin espresso</p>
                </div>
                <div className="glass p-5 rounded-2xl text-center">
                  <Wine className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-heading text-lg">Curated Wine</h4>
                  <p className="text-sm text-smoke-400">Old & new world</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="glass p-5 rounded-2xl text-center">
                  <Music className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-heading text-lg">Live Jazz</h4>
                  <p className="text-sm text-smoke-400">Every Thursday</p>
                </div>
                <div className="glass p-5 rounded-2xl text-center">
                  <Calendar className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-heading text-lg">Happy Hour</h4>
                  <p className="text-sm text-smoke-400">Mon–Fri 5–7pm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      {galleryImages.length > 0 && (
        <section className="section-py pt-0">
          <div className="container-custom">
            <div className="text-center mb-10">
              <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">Visual Feast</span>
              <h2 className="font-display text-3xl md:text-4xl mt-2">Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
              {galleryImages.slice(0, 6).map((img, idx) => (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="aspect-square overflow-hidden rounded-xl"
                >
                  <img src={img.image_url || 'https://placehold.co/400x400'} alt={`Gallery ${idx}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                </motion.div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/gallery" className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1">
                View Full Gallery <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter & Reservation CTA */}
      <section className="section-py bg-gradient-to-b from-smoke-900 to-smoke-950">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl mb-4">Join the Veranda Circle</h2>
          <p className="text-smoke-300 mb-8">Be the first to know about exclusive events, new menu drops, and special offers.</p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" className="flex-1 px-5 py-3 bg-white/5 border border-white/10 rounded-full text-white focus:outline-none focus:border-amber-500/50" required />
            <button type="submit" className="btn-primary py-3">Subscribe</button>
          </form>
          <p className="text-2xs text-smoke-500 mt-4">No spam, unsubscribe anytime.</p>
        </div>
      </section>
    </>
  )
}