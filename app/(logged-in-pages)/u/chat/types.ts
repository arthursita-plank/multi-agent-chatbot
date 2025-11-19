type ChatRole = "assistant" | "user"
type AgentLabel = "chat" | "weather" | "news"

type ChatMessage = {
    id: string
    role: ChatRole
    content: string
    createdAt: Date
    agent?: AgentLabel
}

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

export type { ChatMessage, AssistantResponse, ChatRole, AgentLabel }