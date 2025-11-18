import "server-only"

import Anthropic from "@anthropic-ai/sdk"
import { ChatAnthropic } from "@langchain/anthropic"
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { ToolMessage } from "@langchain/core/messages/tool"
import { DynamicStructuredTool } from "@langchain/core/tools"
import { END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph"
import { ToolNode } from "@langchain/langgraph/prebuilt"
import { wrapSDK } from "langsmith/wrappers"
import { z } from "zod"

import { fetchTopHeadlines } from "@/lib/agents/news"
import { fetchWeatherSummary } from "@/lib/agents/weather"

import type { ClientOptions } from "@anthropic-ai/sdk"

type PersonaRole = "assistant" | "user"
type AgentLabel = "chat" | "weather" | "news"

export type PersonaChatMessage = {
  role: PersonaRole
  content: string
  agent?: AgentLabel
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
    agent: AgentLabel
    toolName?: string
    toolResponse?: string
  }
}

type AgentContext = {
  agent: AgentLabel
  toolName?: string
  toolResponse?: string
}

const TONY_SYSTEM_PROMPT = `You are "FRIDAY+", an upgraded Tony Stark-style AI co-pilot.
- speak with witty confidence, sprinkling subtle Stark sarcasm only when helpful
- respond with concise, actionable insights tailored to ambitious builders
- always acknowledge previous context and suggest next tactical moves
- prioritize clarity, creativity, and momentum; never be dismissive or vague
- Use tools when helpful: call \`get_real_time_weather\` for hyper-local forecasts and \`get_top_headlines\` for timely news intel before responding with a synthesized plan`

const DEFAULT_MODEL_NAME = "claude-sonnet-4-5-20250929"
const LANGSMITH_ENABLED = Boolean(process.env.LANGSMITH_API_KEY)
const LANGSMITH_RUN_NAME = "tony-stark-anthropic"
const WEATHER_TOOL_NAME = "get_real_time_weather"
const NEWS_TOOL_NAME = "get_top_headlines"

const weatherTool = new DynamicStructuredTool({
  name: WEATHER_TOOL_NAME,
  description:
    "Look up real-time weather (temperature, feels-like, humidity, wind) for any city, region, or coordinates.",
  schema: z.object({
    location: z.string().describe("City, region, or coordinates to inspect (e.g., 'Paris, FR' or '37.77,-122.42')."),
    unit: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe("Unit to emphasize in the summary."),
  }),
  func: async ({ location, unit }) => {
    const result = await fetchWeatherSummary({ location, unit })
    return JSON.stringify(result)
  },
})

const newsTool = new DynamicStructuredTool({
  name: NEWS_TOOL_NAME,
  description:
    "Fetch top news headlines for a given country, category, or search topic from NewsAPI (max 5 concise results).",
  schema: z.object({
    country: z
      .string()
      .length(2)
      .optional()
      .describe("Two-letter country code, e.g., 'us' or 'gb'. Defaults to US."),
    category: z
      .string()
      .optional()
      .describe("News category such as business, technology, sports, entertainment."),
    query: z
      .string()
      .optional()
      .describe("Keyword filter if the user mentioned a specific topic."),
    pageSize: z
      .number()
      .min(1)
      .max(5)
      .optional()
      .describe("Maximum headlines to retrieve (1-5)."),
  }),
  func: async ({ country, category, query, pageSize }) => {
    const result = await fetchTopHeadlines({ country, category, query, pageSize })
    return JSON.stringify(result)
  },
})

const agentTools = [weatherTool, newsTool]

let compiledGraph: GraphApp | null = null

export async function generateTonyReply(history: PersonaChatMessage[]): Promise<TonyChatResult> {
  const graph = getGraph()
  const baseMessages = history.map(mapPersonaToBaseMessage)
  const finalState = await graph.invoke({ messages: baseMessages })
  const aiMessage = finalState.messages[finalState.messages.length - 1]
  const agentContext = inferAgentContext(finalState.messages)

  if (!aiMessage || aiMessage._getType() !== "ai") {
    throw new Error("Assistant did not return a valid reply.")
  }

  const reply: PersonaChatMessage = {
    role: "assistant",
    content: stringifyMessage(aiMessage),
    agent: agentContext.agent,
  }

  return {
    message: reply,
    history: finalState.messages
      .map(baseToPersona)
      .filter((value): value is PersonaChatMessage => Boolean(value)),
    metadata: {
      persona: "tony",
      model: getModelName(),
      agent: agentContext.agent,
      toolName: agentContext.toolName,
      toolResponse: agentContext.toolResponse,
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
    createClient: LANGSMITH_ENABLED ? instrumentedAnthropicClientFactory : undefined,
  })
  const agentModel = model.bindTools(agentTools)
  const toolNode = new ToolNode(agentTools, { handleToolErrors: true })

  const builder = new StateGraph(MessagesAnnotation)

  builder.addNode("agent", async (state: GraphState) => {
    const response = await agentModel.invoke([
      new SystemMessage(TONY_SYSTEM_PROMPT),
      ...state.messages,
    ])
    return { messages: [response] }
  })
  builder.addNode("tools", toolNode)

  // @ts-expect-error
  builder.addEdge(START, "agent")
  // @ts-expect-error
  builder.addConditionalEdges("agent", (state) => determineNextStep(state))
  // @ts-expect-error
  builder.addEdge("tools", "agent")

  return builder.compile()
}

function getModelName() {
  return process.env.ANTHROPIC_MODEL || DEFAULT_MODEL_NAME
}

function determineNextStep(state: GraphState) {
  const lastMessage = state.messages[state.messages.length - 1]
  if (isToolRequest(lastMessage)) {
    return "tools"
  }
  return END
}

function isToolRequest(message?: BaseMessage) {
  if (!message || message._getType() !== "ai") {
    return false
  }
  const aiMessage = message as AIMessage
  return Array.isArray(aiMessage.tool_calls) && aiMessage.tool_calls.length > 0
}

function inferAgentContext(messages: BaseMessage[]): AgentContext {
  const lastUserIndex = findLastIndex(messages, (msg) => msg._getType() === "human")

  for (let i = messages.length - 2; i > lastUserIndex; i -= 1) {
    const candidate = messages[i]
    if (candidate?._getType() === "tool") {
      const toolMessage = candidate as ToolMessage
      const agent = mapToolToAgent(toolMessage.name)
      if (agent) {
        return {
          agent,
          toolName: toolMessage.name,
          toolResponse: stringifyMessage(toolMessage),
        }
      }
    }
  }

  return { agent: "chat" as AgentLabel }
}

function findLastIndex<T>(items: T[], predicate: (value: T) => boolean) {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (predicate(items[i]!)) {
      return i
    }
  }
  return -1
}

const instrumentedAnthropicClientFactory = (options: ClientOptions) => {
  const client = new Anthropic(options)

  if (!LANGSMITH_ENABLED) {
    return client
  }

  return wrapSDK(client, {
    name: LANGSMITH_RUN_NAME,
    metadata: { persona: "tony" },
    tags: ["langgraph", "anthropic", "tony-stark"],
  })
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

function stringifyMessage(message: BaseMessage): string {
  if (!message) {
    return ""
  }
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

function mapToolToAgent(toolName?: string): AgentLabel | null {
  if (toolName === WEATHER_TOOL_NAME) {
    return "weather"
  }
  if (toolName === NEWS_TOOL_NAME) {
    return "news"
  }
  return null
}

