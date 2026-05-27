import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../Navbar'
import Footer from '../Footer'
import MobileBottomNav from './MobileBottomNav'
import FloatingReserveButton from '@/components/ui/FloatingReserveButton'

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-smoke-950">
      <Navbar scrolled={scrolled} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <FloatingReserveButton />
    </div>
  )
}