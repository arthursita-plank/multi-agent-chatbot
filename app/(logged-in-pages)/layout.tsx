import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { ROUTES } from "@/constants"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { AuthProvider } from "@/providers/auth-provider"
import { AppSidebar } from "./components/app-sidebar"

export default async function LoggedInLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(ROUTES.LOGIN)
  }

  return (
    <AuthProvider session={session}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
