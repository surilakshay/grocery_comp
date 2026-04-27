import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile, CartItem, Video, Language, BehaviorSignal } from '@/types'

interface AppState {
  user: UserProfile | null
  cart: CartItem[]
  language: Language
  behaviorSignals: BehaviorSignal[]

  setUser: (user: UserProfile) => void
  clearUser: () => void

  setLanguage: (lang: Language) => void

  addToCart: (video: Video) => void
  removeFromCart: (videoId: string) => void
  clearCart: () => void
  cartCount: () => number
  cartTotal: () => number

  recordBehavior: (signal: BehaviorSignal) => void
  getVideoScore: (video: Video) => number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      language: 'en',
      behaviorSignals: [],

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      setLanguage: (lang) => set({ language: lang }),

      addToCart: (video) => {
        const { cart } = get()
        const existing = cart.find((i) => i.video_id === video.id)
        if (existing) {
          set({
            cart: cart.map((i) =>
              i.video_id === video.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          const item: CartItem = {
            id: `${video.id}-${Date.now()}`,
            user_id: get().user?.id || 'guest',
            video_id: video.id,
            video,
            quantity: 1,
          }
          set({ cart: [...cart, item] })
        }
      },

      removeFromCart: (videoId) => {
        set({ cart: get().cart.filter((i) => i.video_id !== videoId) })
      },

      clearCart: () => set({ cart: [] }),

      cartCount: () => get().cart.reduce((sum, i) => sum + i.quantity, 0),

      cartTotal: () =>
        get().cart.reduce((sum, i) => sum + i.video.price * i.quantity, 0),

      recordBehavior: (signal) => {
        const signals = get().behaviorSignals
        const existing = signals.findIndex((s) => s.video_id === signal.video_id)
        if (existing >= 0) {
          const updated = [...signals]
          updated[existing] = { ...updated[existing], ...signal }
          set({ behaviorSignals: updated })
        } else {
          set({ behaviorSignals: [...signals.slice(-100), signal] })
        }
      },

      getVideoScore: (video) => {
        const { user, behaviorSignals } = get()
        if (!user) return Math.random()

        let score = 0.5

        // Vibe match
        if (video.vibe_relevance?.includes(user.vibe)) score += 0.2

        // City match
        if (video.city_relevance?.includes(user.city_tier)) score += 0.1

        // Past behavior boost
        const liked = behaviorSignals.filter((s) => s.liked).map((s) => s.video_id)
        const likedTags = liked.length > 0 ? video.product_tags : []
        if (likedTags.length > 0) score += 0.1

        // Penalize fast-swipes
        const fastSwipes = behaviorSignals.filter((s) => s.swiped_off_fast)
        if (fastSwipes.length > 5) score -= 0.05

        return Math.min(1, score + Math.random() * 0.1)
      },
    }),
    {
      name: 'reelmart-store',
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        language: state.language,
        behaviorSignals: state.behaviorSignals,
      }),
    }
  )
)
