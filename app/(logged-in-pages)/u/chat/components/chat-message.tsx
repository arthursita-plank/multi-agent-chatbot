import { Bot, User } from "lucide-react"
import { FaUserCircle } from "react-icons/fa"
import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"
import { AgentLabel, ChatMessage } from "../types"

type MessageBubbleProps = {
    message: ChatMessage
    displayName: string
}

export function MessageBubble({ message, displayName }: MessageBubbleProps) {
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
