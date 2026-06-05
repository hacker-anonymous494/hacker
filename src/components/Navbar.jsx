// Only showing changed part – replace the entire file content with this
import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Menu, Flame } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/pizza', label: 'Pizza' },
  { to: '/cocktails', label: 'Cocktails' },
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/about', label: 'About' },
]

export default function Navbar({ scrolled }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass-dark border-b border-white/5 py-3' : 'bg-transparent py-5'}`}>
        <div className="container-custom flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Trifilia – Home">
            <div className="relative">
              <Flame className="w-7 h-7 text-ember-500 transition-all duration-300 group-hover:text-ember-400 group-hover:scale-110" />
              <div className="absolute inset-0 blur-md bg-ember-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div>
              <span className="font-accent text-lg font-semibold tracking-widest text-white">Trifilia</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'}
                className={({ isActive }) => `relative px-4 py-2 text-sm font-body font-medium tracking-wide rounded-lg ${isActive ? 'text-ember-400' : 'text-smoke-300 hover:text-white hover:bg-white/5'}`}>
                {({ isActive }) => (<>{link.label}{isActive && <motion.div layoutId="nav-indicator" className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ember-500" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}</>)}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/reservations" className="hidden sm:inline-flex btn-primary text-xs py-2.5 px-5">Reserve a Table</Link>
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-lg text-smoke-300 hover:text-white hover:bg-white/10 transition-colors" aria-label={open ? 'Close menu' : 'Open menu'}>
              <AnimatePresence mode="wait" initial={false}>
                {open ? <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-5 h-5" /></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-5 h-5" /></motion.div>}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-smoke-950/90 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
            <motion.nav initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="fixed right-0 top-0 bottom-0 z-50 w-80 glass-dark border-l border-white/5 flex flex-col pt-20 pb-8 px-6 lg:hidden">
              <div className="flex flex-col gap-1 flex-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div key={link.to} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                    <NavLink to={link.to} end={link.to === '/'} className={({ isActive }) => `flex items-center gap-3 px-4 py-3.5 rounded-xl font-body font-medium text-base ${isActive ? 'text-ember-400 bg-ember-600/10 border border-ember-600/20' : 'text-smoke-300 hover:text-white hover:bg-white/5'}`}>{link.label}</NavLink>
                  </motion.div>
                ))}
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-6 border-t border-white/5 space-y-3">
                <Link to="/reservations" className="btn-primary w-full justify-center text-sm">Reserve a Table</Link>
                <Link to="/contact" className="btn-outline w-full justify-center text-sm">Contact Us</Link>
              </motion.div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
