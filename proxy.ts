import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { match } from "path-to-regexp"
import { createServerClient } from "@supabase/ssr"

import { ROUTES } from "@/constants"

const protectedPages = ["/u", ROUTES.CHAT]

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables")
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )

        supabaseResponse = NextResponse.next({
          request,
        })

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    protectedPages.some((page) => {
      const matcher = match(page)
      return matcher(request.nextUrl.pathname)
    })
  ) {
    const url = request.nextUrl.clone()
    url.pathname = ROUTES.LOGIN
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
