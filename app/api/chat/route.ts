import { NextResponse } from "next/server"
import { z } from "zod"

import { generateTonyReply, type PersonaChatMessage } from "@/lib/ai/langgraph"

export const runtime = "nodejs"

const AgentSchema = z.enum(["chat", "weather", "news"])

const ChatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["assistant", "user"]),
  content: z.string().min(1),
  createdAt: z.union([z.string(), z.number(), z.date()]).optional(),
  agent: AgentSchema.optional(),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).default([]),
})

type ChatRequest = z.infer<typeof ChatRequestSchema>

export async function POST(request: Request) {
  let payload: ChatRequest

  try {
    payload = ChatRequestSchema.parse(await request.json())
  } catch (error) {
    console.error("Invalid chat payload:", error)
    return NextResponse.json({ error: "Invalid chat payload." }, { status: 400 })
  }

  try {
    const history: PersonaChatMessage[] = payload.messages.map(({ role, content, agent }) => ({
      role,
      content,
      agent: normalizeAgent(agent),
    }))

    const result = await generateTonyReply(history)

    return NextResponse.json({
      message: result.message,
      history: result.history,
      metadata: result.metadata,
    })
  } catch (error) {
    console.error("Chat generation failed:", error)
    return NextResponse.json(
      { error: "Assistant failed to respond. Please try again." },
      { status: 500 }
    )
  }
}

function normalizeAgent(agent?: z.infer<typeof AgentSchema>) {
  const result = AgentSchema.safeParse(agent)
  return result.success ? result.data : undefined
}

