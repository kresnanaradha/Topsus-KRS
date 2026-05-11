import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
  error:   <XCircle    className="w-5 h-5 text-red-500   shrink-0" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
}
const BORDERS = { success: 'border-l-green-500', error: 'border-l-red-500', warning: 'border-l-amber-500' }

function ToastItem({ id, message, type, onClose }) {
  return (
    <div className={`flex items-center gap-3 bg-white border border-gray-200 border-l-4 ${BORDERS[type]} rounded-lg shadow-lg px-4 py-3 min-w-[280px] max-w-sm animate-slide-in`}>
      {ICONS[type]}
      <span className="text-sm text-gray-700 flex-1">{message}</span>
      <button onClick={() => onClose(id)} className="text-gray-400 hover:text-gray-600 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onClose={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}
