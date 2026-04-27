'use client'

import { ShoppingCart } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onCartOpen: () => void
}

export default function Navbar({ onCartOpen }: Props) {
  const { cartCount, language, setLanguage } = useAppStore()
  const count = cartCount()

  return (
    <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
      {/* Logo */}
      <div className="text-white font-black text-xl tracking-tight">
        {language === 'hi' ? 'रीलमार्ट' : 'Reelmart'}
        <span className="text-orange-400">.</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="text-white/80 text-xs font-bold bg-white/20 backdrop-blur px-3 py-1.5 rounded-full border border-white/30 active:scale-95 transition-transform"
        >
          {language === 'en' ? 'हिंदी' : 'EN'}
        </button>

        {/* Cart button */}
        <button
          onClick={onCartOpen}
          className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-5 h-5 text-white" />
          <AnimatePresence>
            {count > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs font-black">{count}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  )
}
