'use client'

import { ChatInterface } from "./chat-interface"
import { useSearchParams } from "next/navigation"

export default function NewChatPage() {
    const searchParams = useSearchParams()
    const chatId = searchParams.get('id') || undefined

    return (
        <div className="flex h-full flex-col">
            <ChatInterface chatId={chatId} />
        </div>
    )
}
