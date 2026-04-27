'use client'

import { useCallback } from 'react'
import type { Video } from '@/types'

// Calls the Gemini-backed /api/tag-video endpoint and enriches a video's gemini_tags in-place.
// Used opportunistically when a video becomes active in the feed.
export function useVideoTagger() {
  const tagVideo = useCallback(async (video: Video): Promise<string[]> => {
    if (video.gemini_tags && video.gemini_tags.length > 0) return video.gemini_tags

    try {
      const res = await fetch('/api/tag-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: video.url, title: video.title }),
      })
      if (!res.ok) return []
      const data = await res.json()
      return Array.isArray(data.tags) ? data.tags : []
    } catch {
      return []
    }
  }, [])

  return { tagVideo }
}
