import { ChatInterface } from "./chat-interface"

export default function ChatPage() {
  return (
    <div className="fixed inset-0 flex justify-center overflow-hidden bg-background p-4 sm:p-6">
      <ChatInterface />
    </div>
  )
}