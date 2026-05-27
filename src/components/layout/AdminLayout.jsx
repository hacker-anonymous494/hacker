import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Utensils, 
  Calendar, 
  BookOpen, 
  Image, 
  FileText, 
  LogOut,
  Flame
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/menu', icon: Utensils, label: 'Menu Manager' },
  { to: '/admin/events', icon: Calendar, label: 'Events' },
  { to: '/admin/reservations', icon: BookOpen, label: 'Reservations' },
  { to: '/admin/gallery', icon: Image, label: 'Gallery' },
  { to: '/admin/content', icon: FileText, label: 'Content' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const signOut = useAuthStore((state) => state.signOut)

  const handleLogout = async () => {
    await signOut()
    toast.success('Logged out successfully')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-smoke-950 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-smoke-900 border-r border-white/10 z-40 hidden lg:block">
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500" />
              <span className="font-accent text-base font-semibold tracking-widest text-white">VERANDA</span>
              <span className="text-xs bg-amber-600/30 text-amber-400 px-2 py-0.5 rounded-full ml-2">Admin</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-body transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-600/30'
                      : 'text-smoke-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-sm font-body text-red-400 hover:bg-red-600/10 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:ml-64 flex-1">
        <div className="sticky top-0 z-30 glass-dark border-b border-white/5 px-6 py-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <span className="font-accent text-sm font-semibold">Admin Panel</span>
            </div>
            <button onClick={handleLogout} className="text-red-400 text-sm">Logout</button>
          </div>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}