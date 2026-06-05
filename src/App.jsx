import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect, Suspense, lazy } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAnalytics } from '@/hooks/useAnalytics'
import Layout from '@/components/layout/Layout'
import AdminLayout from '@/components/layout/AdminLayout'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import PageLoader from '@/components/ui/PageLoader'
import TableManager from '@/admin/TableManager'

// Lazy-loaded pages
const Home       = lazy(() => import('@/pages/Home'))
const Menu       = lazy(() => import('@/pages/Menu'))
const Cocktails  = lazy(() => import('@/pages/Cocktails'))
const Pizza      = lazy(() => import('@/pages/Pizza'))
const Events     = lazy(() => import('@/pages/Events'))
const Gallery    = lazy(() => import('@/pages/Gallery'))
const Reservations = lazy(() => import('@/pages/Reservations'))
const JoinGroup   = lazy(() => import('@/pages/JoinGroup'))
const About      = lazy(() => import('@/pages/About'))
const Contact    = lazy(() => import('@/pages/Contact'))
const AdminLogin = lazy(() => import('@/pages/AdminLogin'))

// Admin pages
const AdminDashboard = lazy(() => import('@/admin/Dashboard'))
const AdminMenu = lazy(() => import('@/admin/MenuManager'))
const AdminEvents = lazy(() => import('@/admin/EventsManager'))
const AdminReservations = lazy(() => import('@/admin/ReservationsManager'))
const AdminGallery = lazy(() => import('@/admin/GalleryManager'))
const AdminContent = lazy(() => import('@/admin/ContentManager'))

export default function App() {
  const location = useLocation()
  const initialize = useAuthStore((s) => s.initialize)
  useAnalytics()

  useEffect(() => {
    initialize()
  }, [initialize])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="menu" element={<Menu />} />
            <Route path="cocktails" element={<Cocktails />} />
            <Route path="pizza" element={<Pizza />} />
            <Route path="events" element={<Events />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="join" element={<JoinGroup />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Auth */}
          <Route path="admin/login" element={<AdminLogin />} />

          {/* Protected admin routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/menu" element={<AdminMenu />} />
              <Route path="admin/events" element={<AdminEvents />} />
              <Route path="admin/reservations" element={<AdminReservations />} />
              <Route path="admin/gallery" element={<AdminGallery />} />
              <Route path="admin/content" element={<AdminContent />} />
              <Route path="admin/tables" element={<TableManager />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AnimatePresence>
  )
}