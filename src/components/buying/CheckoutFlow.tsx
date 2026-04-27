'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Package, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '@/lib/store/appStore'
import { strings } from '@/i18n/strings'
import type { Address } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  mandliSessionId?: string
  discountedTotal?: number
}

type Step = 'address' | 'confirm' | 'success'

export default function CheckoutFlow({ open, onClose, mandliSessionId, discountedTotal }: Props) {
  const { cart, cartTotal, clearCart, user, language } = useAppStore()
  const t = strings[language]
  const [step, setStep] = useState<Step>('address')
  const [orderId, setOrderId] = useState('')
  const [address, setAddress] = useState<Omit<Address, 'id' | 'user_id' | 'created_at' | 'is_default'>>({
    name: user?.name || '',
    phone: user?.phone || '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  })

  const total = discountedTotal ?? cartTotal()

  const handlePlaceOrder = () => {
    const id = `RM${Date.now().toString().slice(-8)}`
    setOrderId(id)
    setStep('success')
    clearCart()
  }

  const handleClose = () => {
    setStep('address')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 bg-white z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900">
                {step === 'success' ? t.orderSuccess.title : t.checkout.title}
              </h2>
              {step !== 'success' && (
                <button onClick={handleClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {step === 'address' && (
                <AddressStep
                  key="address"
                  address={address}
                  onChange={setAddress}
                  onNext={() => setStep('confirm')}
                  t={t.checkout}
                />
              )}

              {step === 'confirm' && (
                <ConfirmStep
                  key="confirm"
                  address={address}
                  total={total}
                  mandliSessionId={mandliSessionId}
                  onBack={() => setStep('address')}
                  onPlace={handlePlaceOrder}
                  t={t.checkout}
                  tProduct={t.product}
                />
              )}

              {step === 'success' && (
                <SuccessStep
                  key="success"
                  orderId={orderId}
                  onDone={handleClose}
                  t={t.orderSuccess}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function AddressStep({ address, onChange, onNext, t }: {
  address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'is_default'>
  onChange: (a: typeof address) => void
  onNext: () => void
  t: typeof strings.en.checkout
}) {
  const isValid = address.name && address.phone && address.address_line && address.city && address.state && address.pincode

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto px-5 py-4"
    >
      <div className="flex items-center gap-2 mb-5 text-orange-500">
        <MapPin className="w-5 h-5" />
        <span className="font-bold">{t.address}</span>
      </div>

      <div className="space-y-3">
        {([
          ['name', t.name, 'text'],
          ['phone', t.phone, 'tel'],
          ['address_line', t.addressLine, 'text'],
          ['city', t.city, 'text'],
          ['state', t.state, 'text'],
          ['pincode', t.pincode, 'number'],
        ] as const).map(([field, label, type]) => (
          <div key={field}>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{label}</label>
            <input
              type={type}
              value={address[field]}
              onChange={(e) => onChange({ ...address, [field]: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={label}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="w-full bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black text-base py-4 rounded-2xl mt-6 active:scale-95 transition-transform"
      >
        {t.save}
      </button>
    </motion.div>
  )
}

function ConfirmStep({ address, total, mandliSessionId, onBack, onPlace, t, tProduct }: {
  address: Omit<Address, 'id' | 'user_id' | 'created_at' | 'is_default'>
  total: number
  mandliSessionId?: string
  onBack: () => void
  onPlace: () => void
  t: typeof strings.en.checkout
  tProduct: typeof strings.en.product
}) {
  const { cart, language } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5"
    >
      {/* Address summary */}
      <div className="bg-orange-50 rounded-2xl p-4">
        <p className="font-bold text-gray-900">{address.name}</p>
        <p className="text-sm text-gray-600 mt-1">{address.phone}</p>
        <p className="text-sm text-gray-600">{address.address_line}, {address.city}</p>
        <p className="text-sm text-gray-600">{address.state} - {address.pincode}</p>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {cart.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <span className="text-sm text-gray-700 flex-1 mr-2 line-clamp-1">
              {language === 'hi' && item.video.title_hi ? item.video.title_hi : item.video.title}
              {item.quantity > 1 && ` x${item.quantity}`}
            </span>
            <span className="font-bold text-gray-900">₹{item.video.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div className="border border-green-200 bg-green-50 rounded-2xl p-4 flex items-center gap-3">
        <Package className="w-5 h-5 text-green-600" />
        <div>
          <p className="font-bold text-green-800 text-sm">{t.paymentMethod}</p>
          <p className="text-green-600 text-xs">{tProduct.cod}</p>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
        <span className="font-medium text-gray-600">{language === 'hi' ? 'कुल' : 'Total'}</span>
        <span className="text-2xl font-black text-gray-900">₹{total}</span>
      </div>

      <div className="flex gap-3 pb-4">
        <button
          onClick={onBack}
          className="flex-1 border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl active:scale-95 transition-transform"
        >
          Back
        </button>
        <button
          onClick={onPlace}
          className="flex-2 flex-grow-[2] bg-orange-500 text-white font-black text-base py-4 rounded-2xl active:scale-95 transition-transform"
        >
          {t.placeOrder}
        </button>
      </div>
    </motion.div>
  )
}

function SuccessStep({ orderId, onDone, t }: {
  orderId: string
  onDone: () => void
  t: typeof strings.en.orderSuccess
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 flex flex-col items-center justify-center px-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
      </motion.div>
      <h2 className="text-3xl font-black text-gray-900 mb-3">{t.title}</h2>
      <p className="text-gray-500 mb-6">{t.subtitle}</p>
      <div className="bg-gray-50 rounded-2xl px-6 py-4 mb-8">
        <p className="text-xs text-gray-400">{t.orderId}</p>
        <p className="font-black text-gray-900 text-lg tracking-wider">#{orderId}</p>
      </div>
      <button
        onClick={onDone}
        className="w-full bg-orange-500 text-white font-black text-base py-4 rounded-2xl active:scale-95 transition-transform"
      >
        {t.continueShopping}
      </button>
    </motion.div>
  )
}
