/* eslint-disable @next/next/no-img-element */
'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useActions } from 'ai/rsc'
import { toast } from 'sonner'

const TOAST_DURATION = 10_000

export function ISpyGame3({ item }: { item: string }) {
  const [images, setImages] = useState<string[]>([])
  const [currentItem, setCurrentItem] = useState('')
  const [foundItem, setFoundItem] = useState(false)
  const [gamePhase, setGamePhase] = useState('intro')

  useEffect(() => {
    if (gamePhase === 'play' && foundItem) {
      setGamePhase('complete')
    }
  }, [foundItem, gamePhase])

  const startGame = async () => {
    try {
      const response = await fetch('http://localhost:8000/images/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item
        })
      })
      const data = await response.json()
      console.log({ data })
      const imageUrls = data.downloaded_images.map(
        (image: string) => `http://localhost:8000/images/download/${image}`
      )

      const responseForHint = await fetch(
        'http://localhost:8000/images/first-hint',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            item
          })
        }
      )
      const dataForHint = await responseForHint.json()
      const hint = dataForHint.hint

      setImages(imageUrls)
      // setGamePhase('play')
      toast.success(`Lets play. The first hint is ${hint}.`, {
        duration: TOAST_DURATION
      })
      setFoundItem(true)
    } catch (error) {
      console.error('Failed to fetch images:', error)
      toast.error('Failed to start the game. Please try again.')
    }
  }

  const handleImageClick = async (imageUrl: string) => {
    console.log({ imageUrl })
    const parts = imageUrl.split('/')
    const base64ImageUUID = parts.slice(parts.length - 1)[0]
    console.log({ base64ImageUUID })

    const response = await fetch('http://localhost:8000/images/guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        base64Image: base64ImageUUID,
        correctImageText: item
      })
    })
    const data = await response.json()
    if (data.success) {
      toast.success(data.message, {
        duration: TOAST_DURATION
      })
      setGamePhase('complete')
    } else {
      toast.error(data.message, {
        duration: TOAST_DURATION
      })
    }
  }

  return (
    <div className="rounded-xl border border-[#547221] bg-[#B5D97A] p-4">
      <div className="text-white uppercase font-black text-3xl">I Spy</div>

      {(gamePhase === 'intro' || gamePhase === 'play') && (
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
          <GameCanvas
            things={images.map(image => ({ imageUrl: image }))}
            onImageClick={handleImageClick}
          >
            <button
              onClick={startGame}
              className="mt-2 w-full font-black rounded-lg text-xl bg-[#7FB2DD] p-2 text-white hover:bg-[#378cd2]"
            >
              Start Game
            </button>
          </GameCanvas>
        </div>
      )}

      {gamePhase === 'complete' && (
        <div className="mt-4">
          <p>Great job! You found all the items in this game.</p>
          <p>How did you use your Focus Power during the game?</p>
          <p>When else might you use your Focus Power during the day?</p>
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
  things,
  onImageClick
}: {
  children: React.ReactNode
  things: Thing[]
  onImageClick: (imageUrl: string) => void
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
    maskPosition: `${mousePos.x - 300}px ${mousePos.y - 150}px, center`,
    WebkitMaskPosition: `${mousePos.x - 300}px ${mousePos.y - 150}px, center`
  }

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Check if the click is within the binocular area
      const binocularCenterX = mousePos.x
      const binocularCenterY = mousePos.y
      const binocularRadius = 100 // Adjust this value based on your binocular image size

      if (
        Math.sqrt(
          Math.pow(x - binocularCenterX, 2) + Math.pow(y - binocularCenterY, 2)
        ) <= binocularRadius
      ) {
        // Find the closest image to the click position
        let closestImage: Thing | null = null
        let closestDistance = Infinity

        things.forEach((thing, index) => {
          const thingX =
            (parseFloat(thingPositions[index].left) * rect.width) / 100
          const thingY =
            (parseFloat(thingPositions[index].top) * rect.height) / 100
          const distance = Math.sqrt(
            Math.pow(x - thingX, 2) + Math.pow(y - thingY, 2)
          )

          if (distance < closestDistance) {
            closestDistance = distance
            closestImage = thing
          }
        })

        if (closestImage) {
          onImageClick(closestImage.imageUrl)
        }
      }
    },
    [mousePos, things, thingPositions, onImageClick]
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 border-0 sm:max-w-[90vw] sm:max-h-[90vh] sm:h-full">
        <div
          ref={canvasRef}
          className="relative size-full overflow-hidden bg-zinc-50 dark:bg-zinc-950"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
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
            className="absolute inset-0 bg-black/85 pointer-events-none backdrop-blur-lg"
            style={maskStyle}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
