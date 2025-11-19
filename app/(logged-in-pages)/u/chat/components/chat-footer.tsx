import { Button } from "@/components/ui/button"
import { CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal } from "lucide-react"
import { KeyboardEvent, useState } from "react"
import { ENDPOINTS } from "@/constants"
import { AgentLabel, ChatMessage, ChatRole } from "../types"

type AssistantResponse = {
    message: {
      role: "assistant"
      content: string
      agent?: AgentLabel
    }
    history: Array<{
      role: ChatRole
      content: string
    }>
    metadata: {
      persona: string
      model: string
      agent: AgentLabel
      toolName?: string
      toolResponse?: string
    }
  }

const createMessageId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`

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

export const ChatFooter = () => {

    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const canSend = input.trim().length > 0 && !isLoading

    async function handleSend() {
        if (!canSend) return

        const trimmed = input.trim()
        const userMessage: ChatMessage = {
            id: createMessageId(),
            role: "user",
            content: trimmed,
            createdAt: new Date(),
        }

        const nextHistory = [...messages, userMessage]
        setMessages(nextHistory)
        setInput("")
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

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            handleSend()
        }
    }

    return (
        <CardFooter className="flex flex-col gap-3">
            <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me to break down a goal, summarize ideas, or plan next steps…"
                aria-label="Message"
                className="min-h-[140px] resize-none"
            />
            {error ? (
                <p className="text-sm text-destructive">
                    Tony&apos;s uplink hit turbulence: {error}
                </p>
            ) : null}
            <div className="flex items-center justify-between">
                <Button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend}
                    className="gap-2"
                >
                    Send
                    <SendHorizontal className="size-4" aria-hidden />
                </Button>
            </div>
        </CardFooter>
    )
}