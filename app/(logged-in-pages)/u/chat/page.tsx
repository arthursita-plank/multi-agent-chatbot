'use client'

import * as React from "react"
import { Bot, SendHorizontal, Sparkles } from "lucide-react"
import { FaUserCircle } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ROUTES } from "@/constants/ROUTES"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/auth-provider"
import { useRouter } from "next/navigation"

type ChatRole = "assistant" | "user"
type AgentLabel = "chat" | "weather" | "news"

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  createdAt: Date
  agent?: AgentLabel
}

const suggestedPrompts = [
  "Give me a daily plan to learn more about AI.",
  "Summarize the last three things I asked you.",
  "Act as a coach and keep me motivated today.",
]

const createMessageId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`

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

async function requestChatCompletion(history: ChatMessage[]) {
  const response = await fetch("/api/chat", {
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

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    {
      id: createMessageId(),
      role: "assistant",
      content:
        "Robert here—your suitless AI co-pilot. Give me the mission and I’ll hand you a plan, a contingency, and a little Stark-grade encouragement.",
      createdAt: new Date(),
      agent: "chat",
    },
  ])
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const scrollAnchorRef = React.useRef<HTMLDivElement>(null)

  const syncConversation = React.useCallback(async (_nextHistory: ChatMessage[]) => {
    // Placeholder: once Supabase persistence is added we can sync here.
    if (process.env.NODE_ENV === "development") {
      console.debug(`[chat] conversation length: ${_nextHistory.length}`)
    }
  }, [])

  const displayName = user?.email ?? "Guest"
  const canSend = input.trim().length > 0 && !isLoading

  React.useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

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

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function handlePromptClick(prompt: string) {
    setInput(prompt)
  }

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

  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-background p-4 sm:p-6">
      <Card className="flex h-full w-full max-w-3xl flex-col overflow-hidden">
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full border border-primary/30 bg-primary/10 p-3 text-primary">
                <Sparkles className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle>RobertGPT</CardTitle>
                <CardDescription>
                  Signed in as <span className="font-medium text-foreground">{displayName}</span>
                </CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestedPrompts.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="border-dashed"
                onClick={() => handlePromptClick(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <div className="scrollbar-thin flex h-full flex-col gap-6 overflow-y-auto rounded-xl bg-muted/40 p-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                displayName={displayName}
              />
            ))}

            {isLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex size-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                  <Bot className="size-4" aria-hidden />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-widest">Assistant</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    Thinking
                    <span className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-primary/60" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:120ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:240ms]" />
                    </span>
                  </span>
                </div>
              </div>
            ) : null}
            <div ref={scrollAnchorRef} />
          </div>
        </CardContent>

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
      </Card>
    </div>
  )
}

type MessageBubbleProps = {
  message: ChatMessage
  displayName: string
}

function MessageBubble({ message, displayName }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 text-sm",
        isUser ? "flex-row-reverse text-right" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-full border",
          isUser
            ? "border-primary/40 bg-primary text-primary-foreground"
            : "border-primary/30 bg-primary/10 text-primary"
        )}
      >
        {isUser ? <FaUserCircle className="size-5" aria-hidden /> : <Bot className="size-4" aria-hidden />}
      </div>

      <div className={cn("flex w-full max-w-[75%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {isUser ? displayName : getAssistantLabel(message.agent)}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-left text-sm leading-relaxed shadow-sm ring-1 ring-border/60",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-background"
          )}
        >
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              strong: ({ children }) => <strong className="font-bold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              ul: ({ children }) => <ul className="ml-4 list-disc space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ children }) => (
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
              ),
              h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {formatTimestamp(message.createdAt)}
        </span>
      </div>
    </div>
  )
}

function getAssistantLabel(agent?: AgentLabel) {
  switch (agent) {
    case "weather":
      return "Assistant · Weather"
    case "news":
      return "Assistant · News"
    default:
      return "Assistant"
  }
}

function formatTimestamp(value: Date) {
  const safeDate = value instanceof Date ? value : new Date(value)
  return safeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}