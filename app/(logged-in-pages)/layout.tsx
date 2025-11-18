import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { ROUTES } from "@/constants"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AuthProvider } from "@/providers/auth-provider"

export default async function LoggedInLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return <AuthProvider session={session}>{children}</AuthProvider>
}
