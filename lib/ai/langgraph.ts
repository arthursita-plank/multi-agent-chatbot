import "server-only"

import { ChatAnthropic } from "@langchain/anthropic"
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph"

type PersonaRole = "assistant" | "user"

export type PersonaChatMessage = {
  role: PersonaRole
  content: string
}

type GraphState = {
  messages: BaseMessage[]
}

type GraphApp = ReturnType<typeof buildGraph>

type TonyChatResult = {
  message: PersonaChatMessage
  history: PersonaChatMessage[]
  metadata: {
    persona: "tony"
    model: string
  }
}

const TONY_SYSTEM_PROMPT = `You are "FRIDAY+", an upgraded Tony Stark-style AI co-pilot.
- speak with witty confidence, sprinkling subtle Stark sarcasm only when helpful
- respond with concise, actionable insights tailored to ambitious builders
- always acknowledge previous context and suggest next tactical moves
- prioritize clarity, creativity, and momentum; never be dismissive or vague`

const DEFAULT_MODEL_NAME = "claude-sonnet-4-5-20250929"

let compiledGraph: GraphApp | null = null

export async function generateTonyReply(history: PersonaChatMessage[]): Promise<TonyChatResult> {
  const graph = getGraph()
  const baseMessages = history.map(mapPersonaToBaseMessage)
  const finalState = await graph.invoke({ messages: baseMessages })
  const aiMessage = finalState.messages[finalState.messages.length - 1]

  if (!aiMessage || aiMessage._getType() !== "ai") {
    throw new Error("Assistant did not return a valid reply.")
  }

  const reply: PersonaChatMessage = {
    role: "assistant",
    content: stringifyMessage(aiMessage),
  }

  return {
    message: reply,
    history: finalState.messages
      .map(baseToPersona)
      .filter((value): value is PersonaChatMessage => Boolean(value)),
    metadata: {
      persona: "tony",
      model: getModelName(),
    },
  }
}

function getGraph(): GraphApp {
  if (!compiledGraph) {
    compiledGraph = buildGraph()
  }
  return compiledGraph
}

function buildGraph() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.")
  }

  const model = new ChatAnthropic({
    apiKey,
    model: getModelName(),
    temperature: 0.6,
  })

  const builder = new StateGraph(MessagesAnnotation)

  builder.addNode("respond", async (state: GraphState) => {
    const response = await model.invoke([
      new SystemMessage(TONY_SYSTEM_PROMPT),
      ...state.messages,
    ])
    return { messages: [response] }
  })

  builder.addEdge(START, "respond")
  builder.addEdge("respond", END)

  return builder.compile()
}

function getModelName() {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL_NAME
}

function mapPersonaToBaseMessage(message: PersonaChatMessage): BaseMessage {
  if (message.role === "assistant") {
    return new AIMessage(message.content)
  }
  return new HumanMessage(message.content)
}

function baseToPersona(message: BaseMessage): PersonaChatMessage | null {
  const role = message._getType()
  if (role === "ai" || role === "human") {
    return {
      role: role === "ai" ? "assistant" : "user",
      content: stringifyMessage(message),
    }
  }
  return null
}

function stringifyMessage(message: BaseMessage | AIMessage): string {
  if (typeof message.content === "string") {
    return message.content
  }

  return message.content
    .map((chunk) => {
      if (typeof chunk === "string") return chunk
      if ("text" in chunk && chunk.text) return chunk.text
      return ""
    })
    .join("")
    .trim()
}

