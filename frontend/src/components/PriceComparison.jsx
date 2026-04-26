const fmt = (n) => n != null ? `₹${Number(n).toFixed(0)}` : '—'

function PlatformCell({ data, isBetter }) {
  if (!data || !data.found) {
    return (
      <div className="text-center py-2">
        <span className="text-gray-300 text-sm">Not found</span>
      </div>
    )
  }
  return (
    <div className={`rounded-xl px-3 py-2.5 ${isBetter ? 'bg-green-50 ring-2 ring-green-300' : 'bg-gray-50'}`}>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-lg font-bold ${isBetter ? 'text-green-700' : 'text-gray-700'}`}>
          {fmt(data.price)}
        </span>
        {data.mrp && data.mrp > data.price && (
          <span className="text-xs text-gray-400 line-through">{fmt(data.mrp)}</span>
        )}
        {isBetter && <span className="text-xs text-green-600 font-semibold ml-auto">✓ Best</span>}
      </div>
      <div className="text-xs text-gray-500 truncate mt-0.5">{data.product_name}</div>
      {data.unit && <div className="text-xs text-gray-400">{data.unit}</div>}
      {!data.in_stock && (
        <div className="text-xs text-red-500 font-medium mt-1">Out of stock</div>
      )}
    </div>
  )
}

export default function PriceComparison({ result, onProceed, onReset }) {
  const { items = [], summary = {}, optimal_cart = {} } = result

  const {
    zepto_subtotal,
    instamart_subtotal,
    zepto_total_with_delivery,
    instamart_total_with_delivery,
    optimal_strategy,
    optimal_total,
    total_savings_vs_expensive,
    recommendation_reason,
  } = summary

  const strategyLabel = {
    zepto: 'Order from Zepto',
    instamart: 'Order from Instamart',
    split: 'Split order (Zepto + Instamart)',
  }[optimal_strategy] || 'Optimal cart'

  const strategyColor = {
    zepto: 'from-purple-600 to-violet-600',
    instamart: 'from-orange-500 to-red-500',
    split: 'from-green-500 to-teal-500',
  }[optimal_strategy] || 'from-gray-500 to-gray-600'

  return (
    <div className="space-y-6">
      {/* Recommendation banner */}
      <div className={`rounded-2xl bg-gradient-to-r ${strategyColor} p-5 text-white`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium opacity-75 uppercase tracking-wide mb-1">
              Recommendation
            </div>
            <div className="text-xl font-bold">{strategyLabel}</div>
            {recommendation_reason && (
              <p className="text-sm opacity-90 mt-1">{recommendation_reason}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-3xl font-bold">{fmt(optimal_total)}</div>
            {total_savings_vs_expensive > 0 && (
              <div className="text-sm opacity-90">
                Save {fmt(total_savings_vs_expensive)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`card ${optimal_strategy === 'zepto' ? 'ring-2 ring-purple-300' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <span className="font-semibold text-purple-700">Zepto</span>
            {optimal_strategy === 'zepto' && (
              <span className="badge-zepto ml-auto">Best deal</span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmt(zepto_total_with_delivery)}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {fmt(zepto_subtotal)} + ₹25 delivery
          </div>
        </div>
        <div className={`card ${optimal_strategy === 'instamart' ? 'ring-2 ring-orange-300' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🛒</span>
            <span className="font-semibold text-orange-600">Instamart</span>
            {optimal_strategy === 'instamart' && (
              <span className="badge-instamart ml-auto">Best deal</span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">{fmt(instamart_total_with_delivery)}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {fmt(instamart_subtotal)} + ₹30 delivery
          </div>
        </div>
      </div>

      {/* Item-by-item comparison */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Item-by-item breakdown
        </h3>
        <div className="space-y-3">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 px-1">
            <div className="text-xs font-medium text-gray-400">Item</div>
            <div className="text-xs font-medium text-purple-500 text-center">⚡ Zepto</div>
            <div className="text-xs font-medium text-orange-500 text-center">🛒 Instamart</div>
          </div>

          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-center
                                       bg-white rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-sm font-medium text-gray-800">{item.query}</div>
                {item.quantity > 1 && (
                  <div className="text-xs text-gray-400">×{item.quantity}</div>
                )}
                {item.savings_per_unit > 0 && (
                  <div className="badge-savings mt-1">Save {fmt(item.savings_per_unit)}</div>
                )}
              </div>
              <PlatformCell
                data={item.zepto}
                isBetter={item.better_platform === 'zepto' || item.better_platform === 'only_zepto'}
              />
              <PlatformCell
                data={item.instamart}
                isBetter={item.better_platform === 'instamart' || item.better_platform === 'only_instamart'}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onReset} className="btn-secondary flex-1 justify-center">
          ← Edit list
        </button>
        <button
          onClick={() => onProceed(optimal_strategy, optimal_cart)}
          className="btn-primary flex-1 justify-center"
        >
          Place Order →
        </button>
      </div>
    </div>
  )
}
