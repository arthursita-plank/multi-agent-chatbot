'use client'

import { createContext, useContext, useMemo } from "react"
import type { Session } from "@supabase/supabase-js"

type AuthContextValue = {
  session: Session | null
  user: Session["user"] | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  session: Session | null
  children: React.ReactNode
}

export function AuthProvider({ session, children }: AuthProviderProps) {
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
    }),
    [session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}

