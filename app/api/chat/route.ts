import { LangChainAdapter } from "ai"
import { AIMessage, HumanMessage } from "@langchain/core/messages"
import { getGraph } from "@/lib/ai/langgraph"

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages } = await req.json()

  const graph = getGraph()

  const stream = await graph.streamEvents(
    {
      messages: messages.map((m: any) =>
        m.role === "user"
          ? new HumanMessage(m.content)
          : new AIMessage(m.content)
      ),
    },
    {
      version: "v2",
    }
  )

  return LangChainAdapter.toDataStreamResponse(stream)
}

