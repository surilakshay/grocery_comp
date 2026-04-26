const fmt = (n) => n != null ? `₹${Number(n).toFixed(0)}` : '—'

const PLATFORM_META = {
  zepto: { label: 'Zepto', color: 'purple', icon: '⚡', gradient: 'from-purple-600 to-violet-600' },
  instamart: { label: 'Instamart', color: 'orange', icon: '🛒', gradient: 'from-orange-500 to-red-500' },
  split: { label: 'Split Order', color: 'green', icon: '✂️', gradient: 'from-green-500 to-teal-600' },
}

function CartSection({ platform, items }) {
  const meta = PLATFORM_META[platform] || PLATFORM_META.zepto
  if (!items || items.length === 0) return null
  const total = items.reduce((s, i) => s + i.price * (i.quantity || 1), 0)
  return (
    <div className="card">
      <div className={`flex items-center gap-2 mb-4`}>
        <span className="text-xl">{meta.icon}</span>
        <h3 className="font-bold text-gray-800">{meta.label}</h3>
        <span className="ml-auto text-sm font-semibold text-gray-600">{fmt(total)}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-700 flex-1">{item.product_name}</span>
            <span className="text-gray-400 text-xs">{item.unit}</span>
            <span className="text-gray-500 text-xs">×{item.quantity || 1}</span>
            <span className="font-semibold text-gray-800">{fmt(item.price * (item.quantity || 1))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function OrderPlacement({ strategy, cart, onPlaceOrder, onBack, loading, orderResult }) {
  const isSplit = strategy === 'split'
  const meta = PLATFORM_META[strategy] || PLATFORM_META.zepto

  if (orderResult) {
    const success = orderResult.success !== false
    return (
      <div className="space-y-6 text-center">
        <div className={`rounded-2xl p-8 ${success ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-5xl mb-4">{success ? '🎉' : '😕'}</div>
          <h2 className={`text-2xl font-bold mb-2 ${success ? 'text-green-800' : 'text-red-800'}`}>
            {success ? 'Order Placed!' : 'Order Failed'}
          </h2>
          {success && (
            <>
              <div className="text-green-700 font-semibold text-lg mb-1">
                Order ID: {orderResult.order_id}
              </div>
              <div className="text-green-600 text-sm mb-1">
                Total paid: {fmt(orderResult.total)}
              </div>
              <div className="text-green-500 text-sm">
                Estimated delivery: {orderResult.estimated_delivery}
              </div>
            </>
          )}
          {!success && (
            <p className="text-red-600 text-sm">{orderResult.message || 'Something went wrong.'}</p>
          )}
        </div>
        {success && (
          <div className="card">
            <p className="text-sm text-gray-500 text-center">
              Your order is confirmed on{' '}
              <span className="font-semibold text-gray-800">{orderResult.platform}</span>.
              Sit tight — groceries are on their way!
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Review & Place Order</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isSplit
            ? 'Your cart is split across Zepto and Instamart for maximum savings.'
            : `Ordering everything from ${meta.label}.`}
        </p>
      </div>

      {isSplit ? (
        <div className="space-y-4">
          <CartSection platform="zepto" items={cart.zepto} />
          <CartSection platform="instamart" items={cart.instamart} />
        </div>
      ) : (
        <CartSection platform={strategy} items={cart[strategy]} />
      )}

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 justify-center" disabled={loading}>
          ← Back
        </button>
        <button
          onClick={() => onPlaceOrder(strategy, cart)}
          disabled={loading}
          className="btn-primary flex-1 justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Placing order...
            </>
          ) : (
            <>{meta.icon} Confirm Order</>
          )}
        </button>
      </div>
    </div>
  )
}
