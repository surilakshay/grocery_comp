'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store/appStore'
import { useVideoTagger } from '@/hooks/useVideoTagger'
import ProductOverlay from '@/components/overlays/ProductOverlay'
import type { Video } from '@/types'

interface Props {
  video: Video
  isActive: boolean
  onMandliOpen: (video: Video) => void
  onCartOpen: () => void
}

export default function VideoCard({ video, isActive, onMandliOpen, onCartOpen }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const startTimeRef = useRef<number>(0)
  const { recordBehavior } = useAppStore()
  const { tagVideo } = useVideoTagger()
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayIcon, setShowPlayIcon] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (isActive) {
      startTimeRef.current = Date.now()
      el.play().catch(() => {})
      // Fire-and-forget Gemini tagging for personalization
      tagVideo(video).then((tags) => {
        if (tags.length > 0) video.gemini_tags = tags
      })
      setIsPlaying(true)
    } else {
      const watchMs = Date.now() - startTimeRef.current
      const watchPct = el.duration > 0 ? Math.min(100, (el.currentTime / el.duration) * 100) : 0
      el.pause()
      el.currentTime = 0
      setIsPlaying(false)

      if (startTimeRef.current > 0) {
        recordBehavior({
          video_id: video.id,
          watch_percent: watchPct,
          replayed: false,
          liked: false,
          shared: false,
          added_to_cart: false,
          swiped_off_fast: watchMs < 2000,
        })
      }
    }
  }, [isActive])

  const togglePlay = useCallback(() => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play()
      setIsPlaying(true)
    } else {
      el.pause()
      setIsPlaying(false)
    }
    setShowPlayIcon(true)
    setTimeout(() => setShowPlayIcon(false), 800)
  }, [])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={video.url}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted
        playsInline
        preload={isActive ? 'auto' : 'metadata'}
        poster={video.thumbnail_url}
        onClick={togglePlay}
      />

      {/* Tap-to-pause icon */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            {isPlaying ? (
              <div className="flex gap-1.5">
                <div className="w-2 h-7 bg-white rounded-full" />
                <div className="w-2 h-7 bg-white rounded-full" />
              </div>
            ) : (
              <div className="w-0 h-0 border-t-[14px] border-b-[14px] border-l-[24px] border-t-transparent border-b-transparent border-l-white ml-1" />
            )}
          </div>
        </div>
      )}

      <ProductOverlay video={video} onMandliOpen={onMandliOpen} onCartOpen={onCartOpen} />
    </div>
  )
}
