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
        "flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground animate-fade-in",
        className,
      )}
    >
      {animationData && !error ? (
        <div className="relative">
          <Lottie
            animationData={animationData}
            loop
            autoplay
            style={{ width: 160, height: 160 }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-full blur-xl" />
        </div>
      ) : (
        // Enhanced fallback spinner with modern design
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary shadow-lg" />
          <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-primary/10" />
        </div>
      )}
      <div className="text-center space-y-2">
        <p className="fluid-text-sm font-medium">{message}</p>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}


