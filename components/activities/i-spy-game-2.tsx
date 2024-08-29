'use client'

import { useState, useEffect } from 'react'
import { useActions, useUIState } from 'ai/rsc'
import { IconUser, IconOpenAI } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

import type { AI } from '@/lib/chat/actions'

const imageUrl =
  'https://live.staticflickr.com/3249/5862194692_f6a4f87feb_b.jpg'

interface ISpyProps {
  items: string[]
}

export function ISpyGame2({ props: { items } }: { props: ISpyProps }) {
  const [currentItem, setCurrentItem] = useState('')
  const [foundItems, setFoundItems] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [gamePhase, setGamePhase] = useState('intro')
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()
  console.log({ items })

  // New state for circle position
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 })
  const [showCircle, setShowCircle] = useState(false)

  useEffect(() => {
    if (gamePhase === 'play' && foundItems.length === items.length) {
      setGamePhase('complete')
    }
  }, [foundItems, gamePhase, items.length])

  const startGame = () => {
    setGamePhase('play')
    setCurrentItem(getRandomItem())
  }

  const getRandomItem = () => {
    const remainingItems = items.filter(item => !foundItems.includes(item))
    return remainingItems[Math.floor(Math.random() * remainingItems.length)]
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCirclePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleGuess = (x: number, y: number) => {
    // This is a placeholder. In a real implementation, you'd check if the click
    // coordinates match the item's position in the image.
    const isCorrect = Math.random() < 0.5 // Simulating a 50% chance of correct guess

    if (isCorrect) {
      setFoundItems([...foundItems, currentItem])
      setMessage(`Great job! You found the ${currentItem}!`)
      if (foundItems.length + 1 < items.length) {
        setCurrentItem(getRandomItem())
      }
    } else {
      setMessage(`Oops! That's not the ${currentItem}. Keep looking!`)
    }
  }

  return (
    <div className="rounded-xl border bg-zinc-950 p-4 text-green-400">
      <div className="text-lg text-zinc-300">I Spy Game: Focus Power</div>

      {gamePhase === 'intro' && (
        <div className="mt-4">
          <p>Let's practice our Focus Power with the I Spy game!</p>
          <p>
            Remember to use your Focus Binoculars to look carefully at the
            image.
          </p>
          <button
            onClick={startGame}
            className="mt-2 w-full rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
          >
            Start Game
          </button>
        </div>
      )}

      {(gamePhase === 'play' || gamePhase === 'complete') && (
        <>
          <div className="mt-4 text-base">
            Find the {currentItem} in the image:
          </div>
          <div className="mt-2 relative">
            <img
              src={imageUrl}
              alt="I Spy Scene"
              className="w-full h-auto"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const y = e.clientY - rect.top
                handleGuess(x, y)
              }}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setShowCircle(true)}
              onMouseLeave={() => setShowCircle(false)}
            />
            {showCircle && (
              <div
                className="absolute w-16 h-16 border-2 border-red-500 rounded-full pointer-events-none"
                style={{
                  left: circlePosition.x - 32,
                  top: circlePosition.y - 32,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}
          </div>
          <div className="mt-2">Found items: {foundItems.join(', ')}</div>
        </>
      )}

      {gamePhase === 'complete' && (
        <div className="mt-4">
          <p>Great job! You found all the items in this image.</p>
          <p>How did you use your Focus Power during the game?</p>
          <p>When else might you use your Focus Power during the day?</p>
        </div>
      )}

      {message && (
        <div
          className={cn(
            'mt-4 text-center',
            message.includes('Great job') ? 'text-green-500' : 'text-red-500'
          )}
        >
          {message}
        </div>
      )}
    </div>
  )
}
