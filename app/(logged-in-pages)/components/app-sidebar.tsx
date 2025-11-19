'use client'

import { MessageSquare, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatSession {
    id: string
    title: string
    updatedAt: Date
}

// Mock data for now
const MOCK_CHATS: ChatSession[] = [
    { id: '1', title: 'Renewable Energy Project', updatedAt: new Date() },
    { id: '2', title: 'Market Analysis Q3', updatedAt: new Date() },
    { id: '3', title: 'Python Script Visualization', updatedAt: new Date() },
    { id: '4', title: 'New Product Launch Strategy', updatedAt: new Date() },
]

export function AppSidebar() {
    const pathname = usePathname()

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
                        <Button className="w-full justify-start gap-2" variant="secondary">
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                        <div className="flex flex-col gap-1 py-2">
                            {MOCK_CHATS.map((chat) => (
                                <Button
                                    key={chat.id}
                                    variant="ghost"
                                    className={cn(
                                        "justify-start gap-2 px-2 text-sm font-normal",
                                        // For now just highlighting the first one or none, logic can be added later
                                        false && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate">{chat.title}</span>
                                </Button>
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
