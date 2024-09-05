'use client'

import { useState, useEffect } from 'react'
import { useActions, useUIState } from 'ai/rsc'

import { cn } from '@/lib/utils'
import type { AI } from '@/lib/chat/actions'

interface ISpyProps {
  items: string[]
}

export function ISpyGame3({ props: { items } }: { props: ISpyProps }) {
  const [images, setImages] = useState<string[]>([])
  const [currentItem, setCurrentItem] = useState('')
  const [foundItems, setFoundItems] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [gamePhase, setGamePhase] = useState('intro')
  const [, setMessages] = useUIState<typeof AI>()
  const { submitUserMessage } = useActions()

  useEffect(() => {
    if (gamePhase === 'play' && foundItems.length === items.length) {
      setGamePhase('complete')
    }
  }, [foundItems, gamePhase, items.length])

  const startGame = async () => {
    try {
      const response = await fetch('http://localhost:8000/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      })
      const data = await response.json()
      console.log({ data })
      const imageUrls = data.processed_images.map(
        (image: string) => `http://localhost:8000/images/download/${image}`
      )
      setImages(imageUrls)
      setGamePhase('play')
      setCurrentItem(getRandomItem())
    } catch (error) {
      console.error('Failed to fetch images:', error)
      setMessage('Failed to start the game. Please try again.')
    }
  }

  const getRandomItem = () => {
    const remainingItems = items.filter(item => !foundItems.includes(item))
    return remainingItems[Math.floor(Math.random() * remainingItems.length)]
  }

  const handleImageClick = (index: number) => {
    const isCorrect = Math.random() < 0.5

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
            images.
          </p>
          <PlayGameModal>
            <button
              onClick={startGame}
              className="mt-2 w-full rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
            >
              Start Game
            </button>
          </PlayGameModal>
        </div>
      )}

      {(gamePhase === 'play' || gamePhase === 'complete') && (
        <>
          <div className="mt-4 text-base">
            Find the {currentItem} in the images:
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((imageUrl, index) => (
              <img
                key={index}
                src={imageUrl}
                alt={`Object ${index + 1}`}
                className="w-full h-auto cursor-pointer"
                onClick={() => handleImageClick(index)}
              />
            ))}
          </div>
          <div className="mt-2">Found items: {foundItems.join(', ')}</div>
        </>
      )}

      {gamePhase === 'complete' && (
        <div className="mt-4">
          <p>Great job! You found all the items in this game.</p>
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

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { IconClose } from '../ui/icons'

export default function PlayGameModal({
  children
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] sm:h-full">
        <DialogHeader>
          <DialogTitle>iSpy</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-lg text-center mb-4">
            This is an almost full-screen dialog.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            You can add any content you want here.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
