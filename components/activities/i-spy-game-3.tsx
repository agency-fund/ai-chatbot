/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
      // setGamePhase('play')
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
    <div className="rounded-xl border border-[#547221] bg-[#B5D97A] p-4">
      <div className="text-white uppercase font-black text-3xl">I Spy</div>

      {gamePhase === 'intro' && (
        <div className="mt-4">
          <div className="-mx-2 bg-[#547221] text-white p-4 rounded-lg">
            <p>
              <span className="font-black">WHAT IS IT?</span> A game to build
              executive function skills
            </p>
            <p>
              <span className="font-black">THE BIG IDEA</span>
            </p>
            <p>
              This game is about practicing careful looking so you can find the
              object I&apos;m thinking of.
            </p>
          </div>
          <div className="mt-4">
            <p className="font-bold">INSTRUCTIONS</p>
            <ol className="list-decimal list-inside">
              <li>Say THE BIG IDEA.</li>
              <li>
                Gather students in a circle. Say, &quot;Let&apos;s make sure our
                Focus Binoculars are working before we play. See if you can
                catch what I do.&quot; Make a small movement with your face
                (e.g., wink one eye, blink twice, or wiggle your nose).
              </li>
              <li>
                Say, &quot;Now let&apos;s use our Focus Binoculars to see if you
                can guess what object in the room I&apos;m thinking about. I spy
                with my little eyes something that is _____ (e.g., choose a
                color).&quot;
              </li>
              <li>
                Students point their Focus Binoculars at their best guess. Ask
                them what they are focusing on, and the first person who guesses
                right gets to pick the next object!
              </li>
            </ol>
          </div>
          <div className="mt-4">
            <p className="font-bold">
              MUST DO: Must require students to ignore distractions/irrelevant
              information.
            </p>
            <p className="font-bold">
              CAN ADAPT: Look for more complicated objects.
            </p>
          </div>
          <p className="mt-4">
            Let&apos;s practice our Focus Power with the I Spy game!
          </p>
          <p>
            Remember to use your Focus Binoculars to look carefully at the
            images.
          </p>
          <GameCanvas things={images.map(image => ({ imageUrl: image }))}>
            <button
              onClick={startGame}
              className="mt-2 w-full font-black rounded-lg text-xl bg-[#7FB2DD] p-2 text-white hover:bg-[#378cd2]"
            >
              Start Game
            </button>
          </GameCanvas>
        </div>
      )}

      {(gamePhase === 'play' || gamePhase === 'complete') && (
        <>
          <div className="mt-4 text-base">
            Find the {currentItem} in the images:
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((imageUrl, index) => (
              // eslint-disable-next-line @next/next/no-img-element
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'

interface Thing {
  imageUrl: string
}

export default function GameCanvas({
  children,
  things
}: {
  children: React.ReactNode
  things: Thing[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const thingPositions = useMemo(() => {
    return things.map(() => ({
      top: `${Math.random() * 80 + 10}%`, // 10% to 90%
      left: `${Math.random() * 80 + 10}%`
    }))
  }, [things])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [])

  const maskStyle = {
    mask: `url('/binocular-image.png') no-repeat,
           linear-gradient(#000 0 0)`,
    WebkitMask: `url('/binocular-image.png') no-repeat,
                 linear-gradient(#000 0 0)`,
    maskComposite: 'exclude',
    WebkitMaskComposite: 'exclude',
    maskPosition: `${mousePos.x - 150}px ${mousePos.y - 50}px, center`,
    WebkitMaskPosition: `${mousePos.x - 150}px ${mousePos.y - 50}px, center`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 border-0 sm:max-w-[90vw] sm:max-h-[90vh] sm:h-full">
        <div
          ref={canvasRef}
          className="relative size-full overflow-hidden bg-zinc-50 dark:bg-zinc-950"
          onMouseMove={handleMouseMove}
        >
          {things.map((thing, index) => (
            <div
              key={index}
              className="absolute"
              style={{
                top: thingPositions[index].top,
                left: thingPositions[index].left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <img
                src={thing.imageUrl}
                alt={`Item ${index + 1}`}
                className="size-32 lg:size-64 object-contain"
              />
            </div>
          ))}
          <div
            className="absolute inset-0 bg-black/85 pointer-events-none backdrop-blur-sm"
            style={maskStyle}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
