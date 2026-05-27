import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PageLoader from '@/components/ui/PageLoader'

export default function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuthStore()

  if (loading) return <PageLoader />
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />
  return <Outlet />
}