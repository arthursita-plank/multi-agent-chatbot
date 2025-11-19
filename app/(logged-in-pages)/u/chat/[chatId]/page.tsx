import { ChatInterface } from "../chat-interface"

interface ChatPageProps {
  params: Promise<{
    chatId: string
  }>
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params
  return (
    <div className="flex h-full flex-col">
      <ChatInterface chatId={chatId} />
    </div>
  )
}