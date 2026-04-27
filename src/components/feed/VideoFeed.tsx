'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import VideoCard from './VideoCard'
import { usePersonalizedFeed } from '@/hooks/usePersonalizedFeed'
import type { Video } from '@/types'

interface Props {
  onMandliOpen: (video: Video) => void
  onCartOpen: () => void
}

export default function VideoFeed({ onMandliOpen, onCartOpen }: Props) {
  const videos = usePersonalizedFeed()
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = itemRefs.current.findIndex((el) => el === entry.target)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { threshold: 0.6 }
    )

    itemRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [videos.length])

  const setItemRef = useCallback((el: HTMLDivElement | null, idx: number) => {
    itemRefs.current[idx] = el
    if (el && observerRef.current) {
      observerRef.current.observe(el)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {videos.map((video, idx) => (
        <div
          key={`${video.id}-${idx}`}
          ref={(el) => setItemRef(el, idx)}
          className="w-full h-full snap-start snap-always flex-shrink-0"
          style={{ height: '100dvh' }}
        >
          <VideoCard
            video={video}
            isActive={idx === activeIndex}
            onMandliOpen={onMandliOpen}
            onCartOpen={onCartOpen}
          />
        </div>
      ))}
    </div>
  )
}
