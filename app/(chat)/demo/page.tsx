import { ISpyGame3 } from '@/components/activities/i-spy-game-3'
import { AI } from '@/lib/chat/actions'

export default async function DemoPage() {
  const items = ['apple', 'book', 'cat', 'dog', 'elephant', 'flower']

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
        content: "Let's start playing the I Spy game. Can you find the items?",
        role: 'assistant' as const
      }
    ]
  }

  return (
    <AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">I Spy Game Demo</h1>
        <ISpyGame3 props={{ items }} />
      </div>
    </AI>
  )
}
