"use client"

import { useEffect, useState } from "react"
import Lottie from "lottie-react"
import { cn } from "@/lib/utils"

interface LoadingLottieProps {
  message?: string
  className?: string
}

/**
 * Generic loading component that tries to play a Lottie animation from
 * `/public/lottie/loading.json`. If the file is missing or fails to load,
 * it gracefully falls back to a simple spinner.
 *
 * To customize the animation, place a Lottie JSON file at:
 *   public/lottie/loading.json
 */
export function LoadingLottie({ message = "Loading...", className }: LoadingLottieProps) {
  const [animationData, setAnimationData] = useState<any | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadAnimation = async () => {
      try {
        const res = await fetch("/lottie/loading.json")
        if (!res.ok) {
          throw new Error(`Failed to load Lottie JSON: ${res.status}`)
        }
        const json = await res.json()
        if (isMounted) {
          setAnimationData(json)
        }
      } catch (err) {
        console.warn("[LoadingLottie] Could not load /lottie/loading.json. Falling back to spinner.", err)
        if (isMounted) {
          setError(true)
        }
      }
    }

    loadAnimation()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground",
        className,
      )}
    >
      {animationData && !error ? (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          style={{ width: 160, height: 160 }}
        />
      ) : (
        // Simple fallback spinner while Lottie loads or if it fails
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      )}
      <p className="text-sm">{message}</p>
    </div>
  )
}


