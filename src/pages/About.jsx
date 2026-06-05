import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Flame, Coffee, Wine, Music, Heart, Award, Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

export default function About() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [storyRef, storyInView] = useInView({ triggerOnce: true, threshold: 0.1 })
  const [valuesRef, valuesInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const values = [
    { icon: Flame, title: 'Wood‑Fired Mastery', desc: 'Our custom‑built oven reaches 900°F for that perfect leopard‑spotted crust.' },
    { icon: Wine, title: 'Small‑Batch Spirits', desc: 'We partner with local distilleries and import rare finds.' },
    { icon: Heart, title: 'Warm Hospitality', desc: 'Every guest is treated like family in our lush, inviting space.' },
    { icon: Award, title: 'Award‑Winning', desc: 'Recognized as “Best New Cocktail Bar 2024” by City Eater.' },
  ]

  const team = [
    { name: 'Elena Rossi', role: 'Executive Chef', image: '/team-chef.jpg' },
    { name: 'Marcus Thorne', role: 'Bar Director', image: '/team-bartender.jpg' },
    { name: 'Sofia Chen', role: 'General Manager', image: '/team-manager.jpg' },
  ]

  return (
    <div className="min-h-screen pt-28 pb-16">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-smoke-900 to-smoke-950" ref={heroRef}>
        <div className="container-custom text-center">
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={stagger}
            className="max-w-3xl mx-auto"
          >
            <motion.span variants={fadeUp} className="text-amber-500 font-accent text-sm tracking-widest uppercase">Our Story</motion.span>
            <motion.h1 variants={fadeUp} className="font-display text-4xl md:text-6xl mt-2 mb-6">A Vision Born from Fire & Ice</motion.h1>
            <motion.p variants={fadeUp} className="text-lg text-smoke-300 leading-relaxed">
              Trifilia opened its doors in 2025 with a simple dream: to create a space where the primal crackle of a wood‑fired oven meets the sophisticated artistry of craft cocktails.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Story Detail */}
      <section className="section-py" ref={storyRef}>
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              animate={storyInView ? "visible" : "hidden"}
              variants={stagger}
            >
              <motion.span variants={fadeUp} className="text-amber-500 font-accent text-sm tracking-widest uppercase">The Trifilia Ethos</motion.span>
              <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl mt-2 mb-5">Where Rustic Meets Refined</motion.h2>
              <motion.p variants={fadeUp} className="text-smoke-300 mb-4">
                Inspired by the lush rooftop terraces of southern Europe and the speakeasy culture of New York, Trifilia is an escape from the ordinary. 
                Our name evokes open‑air elegance – a place to linger over a perfectly charred pizza and a Negroni as the city hums below.
              </motion.p>
              <motion.p variants={fadeUp} className="text-smoke-300 mb-6">
                We source from local farms, mill our own flour, and hand‑pick every botanical for our syrups and tinctures. 
                Sustainability is at our core: zero‑waste kitchen practices and compostable packaging for takeout.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link to="/reservations" className="btn-primary">Experience Trifilia</Link>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={storyInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden glass">
                <img src="../public/about-interior.jpg" alt="Trifilia interior" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-600/20 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="section-py bg-radial-ember" ref={valuesRef}>
        <div className="container-custom">
          <motion.div
            initial="hidden"
            animate={valuesInView ? "visible" : "hidden"}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.span variants={fadeUp} className="text-amber-500 font-accent text-sm tracking-widest uppercase">What We Stand For</motion.span>
            <motion.h2 variants={fadeUp} className="font-display text-3xl md:text-4xl mt-2">Our Core Values</motion.h2>
            <motion.div variants={fadeUp} className="w-20 h-0.5 bg-amber-500/50 mx-auto mt-4" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.1 }}
                className="glass p-6 rounded-2xl text-center hover:shadow-amber transition-all duration-300"
              >
                <value.icon className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                <h3 className="font-heading text-xl mb-2">{value.title}</h3>
                <p className="text-sm text-smoke-400">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="section-py">
        <div className="container-custom">
          <div className="text-center mb-12">
            <span className="text-amber-500 font-accent text-sm tracking-widest uppercase">The Faces Behind the Bar</span>
            <h2 className="font-display text-3xl md:text-4xl mt-2">Meet Our Team</h2>
            <div className="w-20 h-0.5 bg-amber-500/50 mx-auto mt-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl overflow-hidden text-center group"
              >
                <div className="aspect-square overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-xl">{member.name}</h3>
                  <p className="text-amber-400 text-sm font-body">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-py pt-0">
        <div className="container-custom">
          <div className="glass rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600/10 to-transparent" />
            <h2 className="font-display text-2xl md:text-3xl mb-3">Visit Us</h2>
            <p className="text-smoke-300 max-w-md mx-auto mb-6">Come savor the warmth. Walk‑ins welcome, reservations recommended.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/reservations" className="btn-primary">Reserve Now</Link>
              <Link to="/contact" className="btn-outline">Find Us</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
