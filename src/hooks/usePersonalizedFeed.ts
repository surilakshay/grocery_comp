'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store/appStore'
import { MOCK_VIDEOS } from '@/lib/mockVideos'
import type { Video } from '@/types'

export function usePersonalizedFeed(): Video[] {
  const { user, getVideoScore } = useAppStore()

  return useMemo(() => {
    const scored = MOCK_VIDEOS.map((v) => ({
      video: v,
      score: getVideoScore(v),
    }))
    scored.sort((a, b) => b.score - a.score)
    // Interleave: top scored + random for serendipity
    const top = scored.slice(0, 4).map((s) => s.video)
    const rest = scored.slice(4).map((s) => s.video)
    const serendipity = [...rest].sort(() => Math.random() - 0.5)
    return [...top, ...serendipity, ...top, ...serendipity] // infinite-ish loop
  }, [user?.vibe, user?.city_tier])
}
