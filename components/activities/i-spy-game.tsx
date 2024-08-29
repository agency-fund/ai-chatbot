'use client'

import { useState, useEffect } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { IconUser, IconOpenAI } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import type { AI } from '@/lib/chat/actions'

interface ISpyProps {
  items: string[]
}

export function ISpyGame({ props: { items } }: { props: ISpyProps }) {
  const [currentItem, setCurrentItem] = useState('')
  const [guess, setGuess] = useState('')
  const [message, setMessage] = useState('')
  const [gamePhase, setGamePhase] = useState('intro')
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  const [turn, setTurn] = useState<'player' | 'ai'>('player')

  useEffect(() => {
    if (items.length > 0) {
      setCurrentItem(items[Math.floor(Math.random() * items.length)])
    }
  }, [items])

  const handleGuess = async () => {
    if (guess.toLowerCase() === currentItem.toLowerCase()) {
      setMessage('Correct! You guessed it!')
      const response = await submitUserMessage(`I spy ${currentItem}`)
      setMessages(currentMessages => [...currentMessages, response])

      // Set a new item for the next round and switch turn to AI
      const newItem = items[Math.floor(Math.random() * items.length)]
      setCurrentItem(newItem)
      setTurn('ai')
    } else {
      setMessage('Try again!')
    }
    setGuess('')
  }

  const startGame = () => {
    setGamePhase('play')
    // Set a new item for the first round
    const newItem = items[Math.floor(Math.random() * items.length)]
    setCurrentItem(newItem)
    setTurn('player')
  }

  return (
    <div className="rounded-xl border bg-zinc-950 p-4 text-green-400 relative">
      {gamePhase === 'play' && (
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          <span className="text-sm">Turn:</span>
          {turn === 'player' ? (
            <IconUser className="size-6 text-blue-500" />
          ) : (
            <IconOpenAI className="size-6 text-green-500" />
          )}
        </div>
      )}

      <div className="text-lg text-zinc-300">I Spy Game: Focus Power</div>

      {gamePhase === 'intro' && (
        <div className="mt-4">
          <p>Let&apos;s practice our Focus Power with the I Spy game!</p>
          <p>Remember to use your Focus Binoculars to look carefully.</p>
          <button
            onClick={startGame}
            className="mt-2 w-full rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
          >
            Start Game
          </button>
        </div>
      )}

      {gamePhase === 'play' && (
        <>
          <div className="mt-4 text-base">
            {turn === 'player'
              ? 'I spy with my little eye, something that is...'
              : 'AI is thinking of an item. Can you guess what it is?'}
          </div>
          <div className="mt-4">
            <input
              type="text"
              value={guess}
              onChange={e => setGuess(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 p-2 text-white"
              placeholder="Enter your guess"
            />
            <button
              onClick={handleGuess}
              className="mt-2 w-full rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
            >
              Guess
            </button>
          </div>
        </>
      )}

      {message && (
        <div
          className={cn(
            'mt-4 text-center',
            message.includes('Correct') ? 'text-green-500' : 'text-red-500'
          )}
        >
          {message}
        </div>
      )}
    </div>
  )
}
