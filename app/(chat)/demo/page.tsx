import { ISpyGame3 } from '@/components/activities/i-spy-game-3'
import { AI } from '@/lib/chat/actions'

export default async function DemoPage() {
  const chat = {
    id: 'demo-chat-id',
    messages: [
      {
        id: 'message-1',
        content: 'Welcome to the I Spy Game Demo!',
        role: 'system' as const
      },
      {
        id: 'message-2',
        content: "Let's start playing the I Spy game. Can you find the chair?",
        role: 'assistant' as const
      }
    ]
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">I Spy Game Demo</h1>
        <ISpyGame3 item="lawn chair" />
      </div>
    </AI>
  )
}
