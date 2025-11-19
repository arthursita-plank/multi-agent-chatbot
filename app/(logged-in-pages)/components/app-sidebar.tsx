'use client'

import { MessageSquare, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { getChats } from "@/actions/chat"
import { useEffect, useState } from "react"

interface ChatSession {
    id: string
    title: string
    updated_at: string
}

export function AppSidebar() {
    const pathname = usePathname()
    const [chats, setChats] = useState<ChatSession[]>([])

    useEffect(() => {
        getChats().then((data) => {
            // @ts-ignore - supabase types mismatch with interface but it's fine for now
            setChats(data || [])
        })
    }, [])

    return (
        <div className="flex h-full w-[280px] flex-col border-r bg-muted/10">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
                <Link href="/u/chat" className="flex items-center gap-2 font-semibold">
                    <MessageSquare className="h-6 w-6" />
                    <span className="">Conversations</span>
                </Link>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Settings</span>
                </Button>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto">
                    <div className="flex flex-col gap-2 p-4">
                        <Link href="/u/chat">
                            <Button className="w-full justify-start gap-2" variant="secondary">
                                <Plus className="h-4 w-4" />
                                New Chat
                            </Button>
                        </Link>
                        <div className="flex flex-col gap-1 py-2">
                            {chats.map((chat) => (
                                <Link key={chat.id} href={`/u/chat/${chat.id}`}>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start gap-2 px-2 text-sm font-normal",
                                            pathname === `/u/chat/${chat.id}` && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{chat.title || "Untitled Chat"}</span>
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t p-4">
                {/* User profile or other footer items could go here */}
            </div>
        </div>
    )
}
