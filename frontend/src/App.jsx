import { useState } from 'react'
import GroceryInput from './components/GroceryInput'
import PriceComparison from './components/PriceComparison'
import OrderPlacement from './components/OrderPlacement'

const STEPS = ['input', 'compare', 'order']

async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'API error')
  return data
}

const STEP_LABELS = ['1. Your List', '2. Compare Prices', '3. Place Order']

export default function App() {
  const [step, setStep] = useState('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [compareResult, setCompareResult] = useState(null)
  const [orderStrategy, setOrderStrategy] = useState(null)
  const [orderCart, setOrderCart] = useState(null)
  const [orderResult, setOrderResult] = useState(null)

  const handleCompare = async (items) => {
    setError(null)
    setLoading(true)
    try {
      const result = await apiPost('/api/compare', { items })
      setCompareResult(result)
      setStep('compare')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToOrder = (strategy, cart) => {
    setOrderStrategy(strategy)
    setOrderCart(cart)
    setOrderResult(null)
    setStep('order')
  }

  const handlePlaceOrder = async (strategy, cart) => {
    setError(null)
    setLoading(true)
    try {
      let result
      if (strategy === 'split') {
        // Place both orders sequentially
        const zeptoResult = cart.zepto?.length
          ? await apiPost('/api/order', { platform: 'zepto', cart_items: cart.zepto })
          : null
        const imResult = cart.instamart?.length
          ? await apiPost('/api/order', { platform: 'instamart', cart_items: cart.instamart })
          : null
        result = {
          success: true,
          platform: 'zepto + instamart',
          order_id: [zeptoResult?.order_id, imResult?.order_id].filter(Boolean).join(' & '),
          total: (zeptoResult?.total || 0) + (imResult?.total || 0),
          estimated_delivery: '15-20 mins',
          message: 'Both orders placed successfully!',
        }
      } else {
        result = await apiPost('/api/order', {
          platform: strategy,
          cart_items: cart[strategy] || [],
        })
      }
      setOrderResult(result)
    } catch (e) {
      setError(e.message)
      setOrderResult({ success: false, message: e.message })
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('input')
    setCompareResult(null)
    setOrderStrategy(null)
    setOrderCart(null)
    setOrderResult(null)
    setError(null)
  }

  const currentStepIdx = STEPS.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-orange-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛒</span>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Smart Grocery</h1>
              <div className="text-xs text-gray-400">Zepto vs Instamart</div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${idx < currentStepIdx ? 'bg-green-500 text-white' :
                    idx === currentStepIdx ? 'bg-violet-600 text-white' :
                    'bg-gray-100 text-gray-400'}`}>
                  {idx < currentStepIdx ? '✓' : idx + 1}
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={`w-4 h-0.5 ${idx < currentStepIdx ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
            <span className="text-red-500 font-bold shrink-0">!</span>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="card">
          {step === 'input' && (
            <GroceryInput onCompare={handleCompare} loading={loading} />
          )}

          {step === 'compare' && compareResult && (
            <PriceComparison
              result={compareResult}
              onProceed={handleProceedToOrder}
              onReset={reset}
            />
          )}

          {step === 'order' && (
            <OrderPlacement
              strategy={orderStrategy}
              cart={orderCart}
              onPlaceOrder={handlePlaceOrder}
              onBack={() => setStep('compare')}
              loading={loading}
              orderResult={orderResult}
            />
          )}
        </div>

        {/* Extensibility note - visible only on input step */}
        {step === 'input' && (
          <div className="mt-4 text-center text-xs text-gray-400">
            Coming soon: voice input, photo scanning & auto-repurchase from order history
          </div>
        )}
      </main>
    </div>
  )
}
