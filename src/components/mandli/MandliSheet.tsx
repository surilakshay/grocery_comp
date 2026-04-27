'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Timer, Share2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { strings } from '@/i18n/strings'
import type { Video, MandliSession } from '@/types'

interface Props {
  video: Video | null
  open: boolean
  onClose: () => void
  onOrderComplete: (session: MandliSession) => void
}

function createMockSession(video: Video, userId: string): MandliSession {
  const discountedPrice = Math.round(video.price * (1 - (video.mandli_discount_percent || 20) / 100))
  return {
    id: `mandli-${Date.now()}`,
    video_id: video.id,
    video,
    creator_id: userId,
    original_price: video.price,
    current_price: discountedPrice,
    target_count: video.mandli_min_count || 5,
    current_count: 1,
    discount_percent: video.mandli_discount_percent || 20,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    status: 'open',
    participants: [{ id: 'p1', mandli_id: `mandli-${Date.now()}`, user_id: userId, joined_at: new Date().toISOString() }],
    share_url: typeof window !== 'undefined' ? window.location.href : '',
  }
}

export default function MandliSheet({ video, open, onClose, onOrderComplete }: Props) {
  const { user, language } = useAppStore()
  const t = strings[language].mandli
  const [session, setSession] = useState<MandliSession | null>(null)
  const [phase, setPhase] = useState<'intro' | 'active' | 'success' | 'expired'>('intro')
  const [timeLeft, setTimeLeft] = useState(600)
  const [simulatingJoin, setSimulatingJoin] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const joinSimRef = useRef<NodeJS.Timeout | null>(null)

  // Reset when video changes
  useEffect(() => {
    if (open && video) {
      setPhase('intro')
      setSession(null)
      setTimeLeft(600)
    }
  }, [open, video?.id])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          setSession((s) => {
            if (s && s.current_count < s.target_count) {
              setPhase('expired')
            }
            return s
          })
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  // Simulate friends joining (for demo)
  useEffect(() => {
    if (phase !== 'active' || !session) return

    const simulateJoin = () => {
      if (simulatingJoin) return
      setSimulatingJoin(true)
      const delay = 3000 + Math.random() * 5000
      joinSimRef.current = setTimeout(() => {
        setSession((s) => {
          if (!s) return s
          const newCount = s.current_count + 1
          const newSession = { ...s, current_count: newCount }
          if (newCount >= s.target_count) {
            if (timerRef.current) clearInterval(timerRef.current)
            setPhase('success')
            setTimeout(() => onOrderComplete(newSession), 1500)
          }
          return newSession
        })
        setSimulatingJoin(false)
      }, delay)
    }

    simulateJoin()
    return () => { if (joinSimRef.current) clearTimeout(joinSimRef.current) }
  }, [phase, session?.current_count])

  const handleStart = () => {
    if (!video || !user) return
    const s = createMockSession(video, user.id)
    setSession(s)
    setPhase('active')
  }

  const handleWhatsApp = () => {
    if (!session || !video) return
    const title = language === 'hi' && video.title_hi ? video.title_hi : video.title
    const msg = language === 'hi'
      ? `🛍️ मेरे साथ Mandli Buy में जुड़ो!\n\n${title}\n\nसिर्फ ₹${session.current_price} में (${session.discount_percent}% छूट)!\n\n${session.target_count - session.current_count} और लोग चाहिए। जल्दी करो! ⏰\n\n${session.share_url}`
      : `🛍️ Join my Mandli Buy on Reelmart!\n\n${title}\n\nOnly ₹${session.current_price} (${session.discount_percent}% off)!\n\nNeed ${session.target_count - session.current_count} more people. Hurry! ⏰\n\n${session.share_url}`
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  if (!video) return null

  const title = language === 'hi' && video.title_hi ? video.title_hi : video.title

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={phase === 'intro' ? onClose : undefined}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">{t.title}</h3>
                  <p className="text-xs text-gray-400">{t.subtitle}</p>
                </div>
              </div>
              {(phase === 'intro' || phase === 'expired') && (
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-5 pb-8">
              {/* Product preview */}
              <div className="flex gap-3 items-center mb-5 bg-purple-50 rounded-2xl p-3">
                <div
                  className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${video.thumbnail_url})` }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 line-clamp-1">{title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-purple-600 font-black">
                      ₹{session?.current_price ?? Math.round(video.price * (1 - (video.mandli_discount_percent || 20) / 100))}
                    </span>
                    <span className="text-gray-400 text-xs line-through">₹{video.price}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                      {video.mandli_discount_percent}% {t.discount}
                    </span>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {phase === 'intro' && (
                  <IntroPhase
                    key="intro"
                    video={video}
                    t={t}
                    onStart={handleStart}
                    language={language}
                  />
                )}
                {phase === 'active' && session && (
                  <ActivePhase
                    key="active"
                    session={session}
                    timeLeft={timeLeft}
                    t={t}
                    onShareWhatsApp={handleWhatsApp}
                  />
                )}
                {phase === 'success' && session && (
                  <SuccessPhase key="success" session={session} t={t} onClose={onClose} />
                )}
                {phase === 'expired' && (
                  <ExpiredPhase key="expired" t={t} onRetry={handleStart} onClose={onClose} />
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function IntroPhase({ video, t, onStart, language }: { video: Video; t: typeof strings.en.mandli; onStart: () => void; language: string }) {
  const discountedPrice = Math.round(video.price * (1 - (video.mandli_discount_percent || 20) / 100))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="bg-gray-50 rounded-2xl p-4 mb-5">
        <p className="text-sm text-gray-600 text-center mb-3">{t.priceDrops}</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">{language === 'hi' ? 'अभी' : 'Now'}</p>
            <p className="text-2xl font-black text-gray-400 line-through">₹{video.price}</p>
          </div>
          <ChevronRight className="w-6 h-6 text-purple-400" />
          <div className="text-center">
            <p className="text-xs text-purple-600 font-bold">{video.mandli_min_count} {t.friendsJoin}</p>
            <p className="text-3xl font-black text-purple-600">₹{discountedPrice}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-purple-600 text-white font-black text-base py-4 rounded-2xl active:scale-95 transition-transform shadow-lg"
      >
        {t.startMandli} 🤝
      </button>
    </motion.div>
  )
}

function ActivePhase({ session, timeLeft, t, onShareWhatsApp }: {
  session: MandliSession
  timeLeft: number
  t: typeof strings.en.mandli
  onShareWhatsApp: () => void
}) {
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const progress = session.current_count / session.target_count

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold text-gray-900">
            {session.current_count} {t.participants}
          </span>
          <span className="text-gray-400">
            {session.target_count - session.current_count} {t.needed}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {/* Avatars */}
        <div className="flex mt-2 gap-1">
          {Array.from({ length: session.target_count }).map((_, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i < session.current_count
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-300 border-2 border-dashed border-gray-200'
              }`}
            >
              {i < session.current_count ? '👤' : '+'}
            </div>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center justify-center gap-2 bg-orange-50 rounded-2xl py-3">
        <Timer className="w-4 h-4 text-orange-500" />
        <span className="text-orange-500 font-black text-lg">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </span>
        <span className="text-orange-400 text-sm">{t.timeLeft}</span>
      </div>

      {/* WhatsApp share */}
      <button
        onClick={onShareWhatsApp}
        className="w-full bg-[#25D366] text-white font-black text-base py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-lg"
      >
        <Share2 className="w-5 h-5" />
        {t.shareWhatsApp}
      </button>
    </motion.div>
  )
}

function SuccessPhase({ session, t, onClose }: { session: MandliSession; t: typeof strings.en.mandli; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
      >
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
      </motion.div>
      <h3 className="text-2xl font-black text-gray-900 mb-2">{t.successTitle}</h3>
      <p className="text-gray-500 mb-6">{t.successSubtitle}</p>
      <div className="bg-green-50 rounded-2xl p-4 mb-5">
        <p className="text-4xl font-black text-green-600">₹{session.current_price}</p>
        <p className="text-green-500 text-sm">{session.discount_percent}% off with {session.current_count} people</p>
      </div>
      <button onClick={onClose} className="w-full bg-green-500 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform">
        Place Order ✓
      </button>
    </motion.div>
  )
}

function ExpiredPhase({ t, onRetry, onClose }: { t: typeof strings.en.mandli; onRetry: () => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
      <h3 className="text-xl font-black text-gray-900 mb-2">{t.expiredTitle}</h3>
      <p className="text-gray-500 mb-6">{t.expiredSubtitle}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold py-3 rounded-2xl">
          Cancel
        </button>
        <button onClick={onRetry} className="flex-1 bg-purple-600 text-white font-black py-3 rounded-2xl active:scale-95">
          Try Again
        </button>
      </div>
    </motion.div>
  )
}
