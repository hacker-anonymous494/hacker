import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Instagram, Facebook, Twitter, MapPin, Phone, Clock, Mail } from 'lucide-react'

const LINKS = {
  explore: [
    { to: '/menu',        label: 'Full Menu' },
    { to: '/pizza',       label: 'Artisan Pizza' },
    { to: '/cocktails',   label: 'Cocktails' },
    { to: '/events',      label: 'Live Events' },
    { to: '/gallery',     label: 'Gallery' },
  ],
  visit: [
    { to: '/reservations', label: 'Reservations' },
    { to: '/about',        label: 'Our Story' },
    { to: '/contact',      label: 'Find Us' },
  ],
}

const SOCIALS = [
  { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/verandabar' },
  { icon: Facebook,  label: 'Facebook',  href: 'https://facebook.com/verandabar' },
  { icon: Twitter,   label: 'Twitter',   href: 'https://twitter.com/verandabar' },
]

export default function Footer() {
  return (
    <footer className="bg-smoke-950 border-t border-white/5 pb-24 md:pb-0">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      <div className="container-custom pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-5">
              <Flame className="w-6 h-6 text-amber-500" />
              <span className="font-accent text-base font-semibold tracking-widest text-white">
                VERANDA
              </span>
            </Link>
            <p className="text-smoke-400 text-sm font-body leading-relaxed mb-6">
              Where wood‑fired artisan pizza meets hand‑crafted cocktails.<br />
              A lush escape in the heart of the city.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-smoke-400
                             hover:text-amber-400 hover:bg-amber-600/10 hover:border-amber-600/30
                             transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-accent text-xs font-semibold tracking-widest text-amber-500 uppercase mb-5">
              Explore
            </h4>
            <ul className="space-y-3">
              {LINKS.explore.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm font-body text-smoke-400 hover:text-white transition-colors duration-200 link-underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit */}
          <div>
            <h4 className="font-accent text-xs font-semibold tracking-widest text-amber-500 uppercase mb-5">
              Visit
            </h4>
            <ul className="space-y-3">
              {LINKS.visit.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm font-body text-smoke-400 hover:text-white transition-colors duration-200 link-underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-accent text-xs font-semibold tracking-widest text-amber-500 uppercase mb-5">
              Find Us
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-sm font-body text-smoke-400">
                  42 Veranda Lane<br />
                  New York, NY 10012
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <a href="tel:+12125550142" className="text-sm font-body text-smoke-400 hover:text-white transition-colors">
                  (212) 555-0142
                </a>
              </li>
              <li className="flex gap-3">
                <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <a href="mailto:hello@verandabar.com" className="text-sm font-body text-smoke-400 hover:text-white transition-colors">
                  hello@verandabar.com
                </a>
              </li>
              <li className="flex gap-3">
                <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm font-body text-smoke-400">
                  <div>Mon – Thu: 5pm – 12am</div>
                  <div>Fri – Sat: 5pm – 2am</div>
                  <div>Sun: 4pm – 11pm</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-body text-smoke-600">
            © {new Date().getFullYear()} Veranda. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/privacy" className="text-xs font-body text-smoke-600 hover:text-smoke-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs font-body text-smoke-600 hover:text-smoke-400 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}