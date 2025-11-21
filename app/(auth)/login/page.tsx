import { redirect } from "next/navigation"

import { ROUTES } from "@/constants"
import { createSupabaseServerClient } from "@/lib/supabase/server"

import { LoginForm } from "./components/login-form"

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    redirect(ROUTES.CHAT)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src="/robert_text_logo.png" alt="ROBERT" className="h-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
