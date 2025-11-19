import { Bot } from "lucide-react"
import { RefObject } from "react"

import { ChatMessage } from "../../types"
import { MessageBubble } from "./chat-message"

type ChatListProps = {
    messages: ChatMessage[]
    isLoading: boolean
    displayName: string
    scrollAnchorRef: RefObject<HTMLDivElement | null>
}

export function ChatList({
    messages,
    isLoading,
    displayName,
    scrollAnchorRef,
}: ChatListProps) {
    return (
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
    )
}
