'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store/appStore'
import { strings } from '@/i18n/strings'
import type { CityTier, AgeGroup, Vibe, UserProfile } from '@/types'

const CITY_OPTIONS: { value: CityTier; emoji: string }[] = [
  { value: 'metro', emoji: '🏙️' },
  { value: 'tier2', emoji: '🏘️' },
  { value: 'tier3', emoji: '🌾' },
]

const AGE_OPTIONS: AgeGroup[] = ['18-24', '25-34', '35-44', '45+']

const VIBE_OPTIONS: { value: Vibe; emoji: string }[] = [
  { value: 'deal_hunter', emoji: '🤑' },
  { value: 'trendy', emoji: '✨' },
  { value: 'home_lover', emoji: '🏠' },
  { value: 'gadget_freak', emoji: '🔧' },
]

export default function OnboardingFlow() {
  const { language, setUser } = useAppStore()
  const t = strings[language].onboarding
  const [step, setStep] = useState(0)
  const [cityTier, setCityTier] = useState<CityTier | null>(null)
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null)
  const [vibe, setVibe] = useState<Vibe | null>(null)

  const handleComplete = () => {
    if (!cityTier || !ageGroup || !vibe) return
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      phone: '',
      name: '',
      city_tier: cityTier,
      age_group: ageGroup,
      vibe,
      preferred_language: language,
      onboarding_done: true,
      created_at: new Date().toISOString(),
    }
    setUser(profile)
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex flex-col items-center justify-center z-50 px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-black text-white tracking-tight">
          {language === 'hi' ? 'रीलमार्ट' : 'Reelmart'}
        </h1>
        <p className="text-white/80 text-sm mt-1">{t.subtitle}</p>
      </motion.div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === step ? 'w-8 bg-white' : i < step ? 'w-2 bg-white' : 'w-2 bg-white/40'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <Step key="step0" title={t.step1Title}>
            <div className="grid gap-3 w-full">
              {CITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setCityTier(opt.value); setStep(1) }}
                  className="flex items-center gap-4 bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 rounded-2xl p-4 text-white text-left transition-all active:scale-95"
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-semibold text-lg">
                    {opt.value === 'metro' ? t.metro : opt.value === 'tier2' ? t.tier2 : t.tier3}
                  </span>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 1 && (
          <Step key="step1" title={t.step2Title}>
            <div className="grid grid-cols-2 gap-3 w-full">
              {AGE_OPTIONS.map((age) => (
                <button
                  key={age}
                  onClick={() => { setAgeGroup(age); setStep(2) }}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur border border-white/30 rounded-2xl p-4 text-white font-bold text-xl text-center transition-all active:scale-95"
                >
                  {age}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step key="step2" title={t.step3Title}>
            <div className="grid grid-cols-2 gap-3 w-full">
              {VIBE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setVibe(opt.value)}
                  className={`flex flex-col items-center gap-2 backdrop-blur border rounded-2xl p-4 text-white text-center transition-all active:scale-95 ${
                    vibe === opt.value
                      ? 'bg-white/40 border-white scale-105'
                      : 'bg-white/20 hover:bg-white/30 border-white/30'
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <span className="font-bold text-sm">
                    {t[opt.value as keyof typeof t]}
                  </span>
                  <span className="text-xs text-white/70">
                    {t[`${opt.value}_sub` as keyof typeof t]}
                  </span>
                </button>
              ))}
            </div>
            {vibe && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleComplete}
                className="mt-6 w-full bg-white text-orange-500 font-black text-lg rounded-2xl py-4 active:scale-95 transition-all shadow-xl"
              >
                {t.letsGo}
              </motion.button>
            )}
          </Step>
        )}
      </AnimatePresence>
    </div>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="w-full max-w-sm"
    >
      <h2 className="text-2xl font-black text-white mb-6 text-center">{title}</h2>
      {children}
    </motion.div>
  )
}
