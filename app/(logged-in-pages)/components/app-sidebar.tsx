'use client'

import { MessageSquare, Plus, Settings, Trash2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { getChats, deleteChat } from "@/actions/chat"
import { useEffect, useState } from "react"

interface ChatSession {
    id: string
    title: string
    updated_at: string
}

export function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const [chats, setChats] = useState<ChatSession[]>([])

    useEffect(() => {
        getChats().then((data) => {
            // @ts-ignore - supabase types mismatch with interface but it's fine for now
            setChats(data || [])
        })
    }, [])

    async function handleDeleteChat(chatId: string) {
        try {
            await deleteChat(chatId)
            setChats((prev) => prev.filter((c) => c.id !== chatId))
            toast.success("Chat deleted")

            if (pathname === `/u/chat/${chatId}`) {
                router.push("/u/chat")
            }
        } catch (error) {
            console.error("Failed to delete chat:", error)
            toast.error("Failed to delete chat")
        }
    }

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
                                <div key={chat.id} className="group relative">
                                    <Link
                                        href={`/u/chat/${chat.id}`}
                                        className={cn(
                                            buttonVariants({ variant: "ghost" }),
                                            "w-full justify-start gap-2 px-2 text-sm font-normal pr-8",
                                            pathname === `/u/chat/${chat.id}` && "bg-accent text-accent-foreground"
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{chat.title || "Untitled Chat"}</span>
                                    </Link>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                <span className="sr-only">Delete chat</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete this conversation. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => handleDeleteChat(chat.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
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
