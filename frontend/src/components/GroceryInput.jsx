import { useState } from 'react'

const QUICK_SUGGESTIONS = [
  'Milk', 'Eggs', 'Bread', 'Rice', 'Dal', 'Onion', 'Tomato', 'Potato',
  'Butter', 'Sugar', 'Oil', 'Atta', 'Paneer', 'Salt', 'Tea', 'Banana',
]

export default function GroceryInput({ onCompare, loading }) {
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState([])
  const [editingIdx, setEditingIdx] = useState(null)

  const parseAndAdd = (raw) => {
    const lines = raw.split(/[\n,]/).map(l => l.trim()).filter(Boolean)
    const newItems = lines.map(line => {
      // try to parse "2x milk" or "milk 2" or just "milk"
      const match = line.match(/^(\d+)\s*[xX×]?\s*(.+)$/) || line.match(/^(.+?)\s+(\d+)$/)
      if (match) {
        const qty = parseInt(match[1]) || parseInt(match[2]) || 1
        const name = (match[2] || match[1]).trim()
        return { name, quantity: qty }
      }
      return { name: line, quantity: 1 }
    })
    setItems(prev => {
      const existing = new Set(prev.map(i => i.name.toLowerCase()))
      return [...prev, ...newItems.filter(i => !existing.has(i.name.toLowerCase()))]
    })
    setInputText('')
  }

  const addSuggestion = (name) => {
    if (!items.find(i => i.name.toLowerCase() === name.toLowerCase())) {
      setItems(prev => [...prev, { name, quantity: 1 }])
    }
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const updateQty = (idx, qty) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      parseAndAdd(inputText)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">What do you need?</h2>
        <p className="text-sm text-gray-500 mt-1">
          Type items below or pick from suggestions. We'll compare prices on Zepto & Instamart.
        </p>
      </div>

      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. milk, 2x eggs, basmati rice..."
          className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-400
                     focus:outline-none text-sm placeholder-gray-400 transition-colors"
        />
        <button
          onClick={() => inputText.trim() && parseAndAdd(inputText)}
          className="px-4 py-3 rounded-xl bg-violet-100 text-violet-700 font-semibold
                     hover:bg-violet-200 transition-colors text-sm whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {/* Quick suggestions */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Quick add</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => addSuggestion(s)}
              disabled={!!items.find(i => i.name.toLowerCase() === s.toLowerCase())}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200
                         text-gray-600 hover:border-violet-300 hover:text-violet-700
                         hover:bg-violet-50 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      {items.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Your list ({items.length} items)
          </p>
          <ul className="space-y-2">
            {items.map((item, idx) => (
              <li key={idx}
                className="flex items-center justify-between gap-3 px-4 py-3
                           bg-gray-50 rounded-xl border border-gray-100">
                <span className="flex-1 text-sm font-medium text-gray-800">{item.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(idx, item.quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600
                               hover:bg-gray-100 flex items-center justify-center text-sm font-bold"
                  >−</button>
                  <span className="w-8 text-center text-sm font-semibold text-gray-700">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(idx, item.quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600
                               hover:bg-gray-100 flex items-center justify-center text-sm font-bold"
                  >+</button>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                >×</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={() => onCompare(items)}
        disabled={items.length === 0 || loading}
        className="btn-primary w-full justify-center text-base py-3"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Fetching prices from Zepto & Instamart...
          </>
        ) : (
          <>
            <span>🔍</span>
            Compare Prices
          </>
        )}
      </button>
    </div>
  )
}
