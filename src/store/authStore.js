import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      isAdmin: false,

      initialize: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          set({ session, user: session.user, loading: false })
          get().checkAdminRole(session.user.id)
        } else {
          set({ loading: false })
        }

        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            set({ session, user: session.user })
            get().checkAdminRole(session.user.id)
          } else {
            set({ session: null, user: null, isAdmin: false })
          }
        })
      },

      checkAdminRole: async (userId) => {
        const { data } = await supabase
          .from('admins')
          .select('id, role')
          .eq('user_id', userId)
          .single()

        set({ isAdmin: !!data })
      },

      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return data
      },

      signOut: async () => {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAdmin: false })
      },
    }),
    {
      name: 'ember-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)