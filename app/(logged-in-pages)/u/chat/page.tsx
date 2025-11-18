'use client'

import { useAuth } from "@/providers/auth-provider"

export default function ChatPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-2 p-6">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{user?.email}</span>
      </p>
    </div>
  )
}