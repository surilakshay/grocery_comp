'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store/appStore'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import VideoFeed from '@/components/feed/VideoFeed'
import Navbar from '@/components/ui/Navbar'
import CartDrawer from '@/components/buying/CartDrawer'
import CheckoutFlow from '@/components/buying/CheckoutFlow'
import MandliSheet from '@/components/mandli/MandliSheet'
import type { Video, MandliSession } from '@/types'

export default function Home() {
  const { user } = useAppStore()
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [mandliVideo, setMandliVideo] = useState<Video | null>(null)
  const [mandliOpen, setMandliOpen] = useState(false)
  const [mandliSession, setMandliSession] = useState<MandliSession | null>(null)

  const handleMandliOpen = (video: Video) => {
    setMandliVideo(video)
    setMandliOpen(true)
  }

  const handleMandliOrderComplete = (session: MandliSession) => {
    setMandliSession(session)
    setMandliOpen(false)
    setCheckoutOpen(true)
  }

  const handleCartCheckout = () => {
    setCartOpen(false)
    setCheckoutOpen(true)
  }

  if (!user?.onboarding_done) {
    return <OnboardingFlow />
  }

  return (
    <main className="fixed inset-0 bg-black overflow-hidden">
      <Navbar onCartOpen={() => setCartOpen(true)} />

      <VideoFeed
        onMandliOpen={handleMandliOpen}
        onCartOpen={() => setCartOpen(true)}
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCartCheckout}
      />

      <CheckoutFlow
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false)
          setMandliSession(null)
        }}
        mandliSessionId={mandliSession?.id}
        discountedTotal={mandliSession ? mandliSession.current_price : undefined}
      />

      <MandliSheet
        video={mandliVideo}
        open={mandliOpen}
        onClose={() => setMandliOpen(false)}
        onOrderComplete={handleMandliOrderComplete}
      />
    </main>
  )
}
