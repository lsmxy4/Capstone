import { createContext, useContext } from 'react'

export type User = { email: string; name?: string }

export const AuthContext = createContext<{
  user: User | null
  loading: boolean
  error: string
  onLogout: () => Promise<void>
}>({ user: null, loading: false, error: '', onLogout: async () => {} })

export const useAuth = () => useContext(AuthContext)
