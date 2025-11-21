'use client'

import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { ROUTES } from "@/constants/ROUTES"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useChat } from "ai/react"

import { ChatInput } from "./components/chat-input"
import { ChatList } from "./components/chat-list"
import { createChat, getMessages, saveMessage } from "@/actions/chat"
import { ChatMessage } from "./types"
import { createMessageId } from "./utils"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { chatSchema, ChatFormValues } from "./schema"

export function ChatInterface({ chatId }: { chatId?: string }) {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])

    const { messages, append, isLoading, setMessages } = useChat({
        api: "/api/chat",
        onError: (error) => {
            toast.error("Robert's uplink hit turbulence: " + error.message)
        },
        onFinish: async (message) => {
            if (chatId) {
                await saveMessage(chatId, {
                    id: message.id,
                    role: "assistant",
                    content: message.content,
                    createdAt: new Date(),
                    agent: "chat" // Defaulting to chat for now as we lost metadata streaming support in simple adapter
                })
            }
        }
    })

    useEffect(() => {
        if (chatId) {
            getMessages(chatId).then((msgs) => {
                if (msgs.length > 0) {
                    setMessages(msgs.map(m => ({
                        id: m.id,
                        role: m.role as any,
                        content: m.content,
                        createdAt: new Date(m.createdAt)
                    })))
                } else {
                    setMessages([
                        {
                            id: createMessageId(),
                            role: "assistant",
                            content:
                                "Robert here—your suitless AI co-pilot. Give me the mission and I’ll hand you a plan, a contingency, and a little Stark-grade encouragement.",
                            createdAt: new Date(),
                        },
                    ])
                }
            })
        } else {
            setMessages([
                {
                    id: createMessageId(),
                    role: "assistant",
                    content:
                        "Robert here—your suitless AI co-pilot. Give me the mission and I’ll hand you a plan, a contingency, and a little Stark-grade encouragement.",
                    createdAt: new Date(),
                },
            ])
        }
    }, [chatId, setMessages])

    const form = useForm<ChatFormValues>({
        resolver: zodResolver(chatSchema),
        defaultValues: {
            input: "",
        },
    })

    const [isSigningOut, setIsSigningOut] = useState(false)
    const scrollAnchorRef = useRef<HTMLDivElement>(null)

    const displayName = user?.email ?? "Guest"

    async function handleSignOut() {
        if (isSigningOut) return
        setIsSigningOut(true)
        try {
            const { error } = await supabase.auth.signOut()
            if (error) {
                console.error("Failed to sign out:", error)
                return
            }
            router.replace(ROUTES.LOGIN)
        } finally {
            setIsSigningOut(false)
        }
    }

    useEffect(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    async function onSubmit(values: ChatFormValues) {
        const trimmed = values.input.trim()
        if (!trimmed) return

        const userMessageId = createMessageId()
        form.reset()

        try {
            let currentChatId = chatId
            let isNewChat = false

            if (!currentChatId) {
                const newChat = await createChat(trimmed.slice(0, 50))
                currentChatId = newChat.id
                isNewChat = true
            }

            await saveMessage(currentChatId!, {
                id: userMessageId,
                role: "user",
                content: trimmed,
                createdAt: new Date(),
            })

            await append({
                id: userMessageId,
                role: "user",
                content: trimmed,
            })

            if (isNewChat) {
                toast.success("Chat created")
                router.replace(`/u/chat?id=${currentChatId}`)
            }
        } catch (cause) {
            console.error("Failed to send chat message:", cause)
            toast.error("Something went wrong. Please try again.")
        }
    }

    // Convert AI SDK messages to ChatMessage type for ChatList
    const uiMessages: ChatMessage[] = messages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        createdAt: m.createdAt || new Date(),
        agent: "chat" // Fallback
    }))

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <header className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold md:text-xl">R.O.B.E.R.T</h1>
                    <span className="text-xs text-muted-foreground">• Awaiting Command</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="flex items-center gap-2 w-full px-2 cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                    </Button>
                </div>
            </header>
            <div className="flex-1 overflow-hidden p-4">
                <Card className="flex h-full flex-col overflow-hidden border-0 shadow-none">
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ChatList
                            messages={uiMessages}
                            isLoading={isLoading}
                            displayName={displayName}
                            scrollAnchorRef={scrollAnchorRef}
                        />
                    </CardContent>
                    <CardFooter className="p-0 pt-4">
                        <ChatInput
                            form={form}
                            onSubmit={onSubmit}
                            isLoading={isLoading}
                        />
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
