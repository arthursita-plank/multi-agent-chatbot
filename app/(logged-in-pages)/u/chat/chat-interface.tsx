'use client'

import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { ENDPOINTS } from "@/constants"
import { ROUTES } from "@/constants/ROUTES"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"
import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { ChatInput } from "./components/chat-input"
import { ChatList } from "./components/chat-list"
import { AssistantResponse, ChatMessage } from "./types"
import { createMessageId } from "./utils"



async function requestChatCompletion(history: ChatMessage[]) {
    const response = await fetch(ENDPOINTS.INTERNAL.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ messages: history }),
    })

    if (!response.ok) {
        const errorMessage = await response.text()
        throw new Error(errorMessage || "Assistant is offline. Please try again.")
    }

    return (await response.json()) as AssistantResponse
}

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { chatSchema, ChatFormValues } from "./schema"

export function ChatInterface() {
    const { user } = useAuth()
    const router = useRouter()
    const supabase = useMemo(() => createClient(), [])
    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        {
            id: createMessageId(),
            role: "assistant",
            content:
                "Robert here—your suitless AI co-pilot. Give me the mission and I’ll hand you a plan, a contingency, and a little Stark-grade encouragement.",
            createdAt: new Date(),
            agent: "chat",
        },
    ])

    const form = useForm<ChatFormValues>({
        resolver: zodResolver(chatSchema),
        defaultValues: {
            input: "",
        },
    })

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const scrollAnchorRef = useRef<HTMLDivElement>(null)

    const syncConversation = useCallback(async (_nextHistory: ChatMessage[]) => {
        // Placeholder: once Supabase persistence is added we can sync here.
        if (process.env.NODE_ENV === "development") {
            console.debug(`[chat] conversation length: ${_nextHistory.length}`)
        }
    }, [])

    const displayName = user?.email ?? "Guest"

    useEffect(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, isLoading])

    async function onSubmit(values: ChatFormValues) {
        const trimmed = values.input.trim()
        if (!trimmed) return

        const userMessage: ChatMessage = {
            id: createMessageId(),
            role: "user",
            content: trimmed,
            createdAt: new Date(),
        }

        const nextHistory = [...messages, userMessage]
        setMessages(nextHistory)
        form.reset()
        setIsLoading(true)
        setError(null)

        try {
            const response = await requestChatCompletion(nextHistory)
            const assistantMessage: ChatMessage = {
                id: createMessageId(),
                role: "assistant",
                content: response.message.content,
                createdAt: new Date(),
                agent: response.metadata.agent ?? response.message.agent ?? "chat",
            }

            setMessages((prev) => [...prev, assistantMessage])
            void syncConversation([...nextHistory, assistantMessage])
        } catch (cause) {
            console.error("Failed to send chat message:", cause)
            setError(
                cause instanceof Error ? cause.message : "Something went wrong. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <header className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px]">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold md:text-xl">J.A.R.V.I.S.</h1>
                    <span className="text-xs text-muted-foreground">• Awaiting Command</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => window.location.reload()}>
                        New Chat
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                    </Button>
                </div>
            </header>
            <div className="flex-1 overflow-hidden p-4">
                <Card className="flex h-full flex-col overflow-hidden border-0 shadow-none">
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ChatList
                            messages={messages}
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
                        {error ? (
                            <p className="text-sm text-destructive mt-2">
                                Tony&apos;s uplink hit turbulence: {error}
                            </p>
                        ) : null}
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
