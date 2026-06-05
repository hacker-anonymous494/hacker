import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Lock, Mail, LogIn, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function AdminLogin() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.signIn)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError('')
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back, admin!')
      navigate('/admin')
    } catch (err) {
      console.error('Login error:', err)
      setError('Invalid email or password. Please try again.')
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-smoke-950 px-4">
      <div className="absolute inset-0 bg-radial-ember opacity-30" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-600/20 mb-4">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="font-display text-2xl font-bold">Admin Portal</h1>
            <p className="text-smoke-400 text-sm mt-2">Sign in to manage Trifilia</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-600/20 border border-red-600/40 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-body mb-2 text-smoke-200">
                <Mail className="inline w-3.5 h-3.5 mr-1" /> Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                placeholder="admin@Trifiliabar.com"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-body mb-2 text-smoke-200">
                <Lock className="inline w-3.5 h-3.5 mr-1" /> Password
              </label>
              <input
                type="password"
                {...register('password')}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-smoke-500 text-center mt-6">
            Demo credentials: admin@Trifiliabar.com / admin123
          </p>
        </div>
      </motion.div>
    </div>
  )
}
