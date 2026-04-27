'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Share2, ShoppingCart, Users, ChevronUp } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { strings } from '@/i18n/strings'
import type { Video } from '@/types'

interface Props {
  video: Video
  onMandliOpen: (video: Video) => void
  onCartOpen: () => void
}

export default function ProductOverlay({ video, onMandliOpen, onCartOpen }: Props) {
  const { language, addToCart, recordBehavior } = useAppStore()
  const t = strings[language].product
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(video.likes_count)
  const [atcState, setAtcState] = useState<'idle' | 'added'>('idle')
  const [infoExpanded, setInfoExpanded] = useState(false)

  const title = language === 'hi' && video.title_hi ? video.title_hi : video.title
  const discountPct = Math.round(((video.original_price - video.price) / video.original_price) * 100)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount((c) => c + (liked ? -1 : 1))
    recordBehavior({ video_id: video.id, watch_percent: 0, replayed: false, liked: !liked, shared: false, added_to_cart: false, swiped_off_fast: false })
  }

  const handleShare = () => {
    recordBehavior({ video_id: video.id, watch_percent: 0, replayed: false, liked, shared: true, added_to_cart: false, swiped_off_fast: false })
    if (navigator.share) {
      navigator.share({ title: title, text: `Check this out on Reelmart! ₹${video.price}`, url: window.location.href })
    }
  }

  const handleATC = () => {
    addToCart(video)
    setAtcState('added')
    recordBehavior({ video_id: video.id, watch_percent: 0, replayed: false, liked, shared: false, added_to_cart: true, swiped_off_fast: false })
    setTimeout(() => setAtcState('idle'), 1500)
    onCartOpen()
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Right action bar */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5 pointer-events-auto">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <motion.div
            animate={liked ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${liked ? 'bg-red-500' : 'bg-black/40 backdrop-blur'}`}
          >
            <Heart className={`w-6 h-6 ${liked ? 'text-white fill-white' : 'text-white'}`} />
          </motion.div>
          <span className="text-white text-xs font-bold drop-shadow">{formatCount(likeCount)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center shadow-lg">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{t.share}</span>
        </button>

        {/* ATC */}
        <button onClick={handleATC} className="flex flex-col items-center gap-1">
          <motion.div
            animate={atcState === 'added' ? { scale: [1, 1.2, 1], backgroundColor: ['#f97316', '#22c55e', '#f97316'] } : {}}
            transition={{ duration: 0.4 }}
            className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
          </motion.div>
          <span className="text-white text-xs font-bold drop-shadow">
            {atcState === 'added' ? t.addedToCart : t.addToCart}
          </span>
        </button>

        {/* Mandli Buy */}
        {video.mandli_eligible && (
          <button onClick={() => onMandliOpen(video)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xs font-bold drop-shadow text-center leading-tight">
              {language === 'hi' ? 'मंडली' : 'Mandli'}
            </span>
          </button>
        )}
      </div>

      {/* Bottom product info */}
      <div className="absolute bottom-0 left-0 right-14 pointer-events-auto">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-4 px-4">
          {/* Seller */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-orange-400 flex items-center justify-center text-white text-xs font-bold">
              {video.seller_name[0]}
            </div>
            <span className="text-white/90 text-sm font-medium">{video.seller_name}</span>
          </div>

          {/* Title */}
          <h3 className="text-white font-bold text-base leading-tight mb-2">{title}</h3>

          {/* Price row */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-white text-xl font-black">₹{video.price}</span>
            <span className="text-white/50 text-sm line-through">₹{video.original_price}</span>
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {discountPct}% {t.off}
            </span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">{t.free_delivery}</span>
            <span className="bg-white/20 backdrop-blur text-white text-xs px-2 py-1 rounded-full">{t.cod}</span>
          </div>

          {/* Expandable product info */}
          <button
            onClick={() => setInfoExpanded(!infoExpanded)}
            className="flex items-center gap-1 text-white/60 text-xs mb-2"
          >
            <ChevronUp className={`w-3 h-3 transition-transform ${infoExpanded ? 'rotate-180' : ''}`} />
            {infoExpanded ? 'Less info' : 'More info'}
          </button>

          <AnimatePresence>
            {infoExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white/70 text-sm mb-2">{video.description}</p>
                <div className="flex flex-wrap gap-1">
                  {video.product_tags.map((tag) => (
                    <span key={tag} className="text-xs text-orange-300 bg-orange-500/20 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <button
            onClick={handleATC}
            className="w-full bg-orange-500 text-white font-black text-base py-3 rounded-2xl mt-2 active:scale-95 transition-transform shadow-lg"
          >
            {atcState === 'added' ? `✓ ${t.addedToCart}` : t.buy}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
