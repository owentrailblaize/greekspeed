"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AvatarContextValue = {
  imageError: boolean
  setImageError: (failed: boolean) => void
  hasSrc: boolean
  setHasSrc: (has: boolean) => void
}

const AvatarContext = React.createContext<AvatarContextValue | null>(null)

function useAvatarContext() {
  return React.useContext(AvatarContext)
}

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [imageError, setImageError] = React.useState(false)
  const [hasSrc, setHasSrc] = React.useState(false)
  const value = React.useMemo<AvatarContextValue>(
    () => ({
      imageError,
      setImageError,
      hasSrc,
      setHasSrc,
    }),
    [imageError, hasSrc]
  )
  return (
    <AvatarContext.Provider value={value}>
      <div
        ref={ref}
        className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
        {...props}
      />
    </AvatarContext.Provider>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt = "", ...props }, ref) => {
  const ctx = useAvatarContext()

  React.useEffect(() => {
    if (ctx) {
      ctx.setHasSrc(!!src)
      if (!src) ctx.setImageError(false)
    }
  }, [src, ctx])

  React.useEffect(() => {
    if (ctx && src) ctx.setImageError(false)
  }, [src, ctx])

  if (!src) return null
  if (ctx?.imageError) return null

  return (
    <img
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      src={src}
      alt={alt}
      onError={() => ctx?.setImageError(true)}
      {...props}
    />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const ctx = useAvatarContext()
  const showFallback = !ctx || ctx.imageError || !ctx.hasSrc

  if (!showFallback) return null

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }