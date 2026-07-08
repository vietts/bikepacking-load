import { useEffect } from 'react'

interface ToastProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
  duration?: number // ms before auto-dismiss
}

// Lightweight toast — no dependency. Auto-dismisses after `duration`, and can
// carry a single action (e.g. Undo). Render at most one at a time.
export function Toast({ message, actionLabel, onAction, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    const id = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(id)
  }, [onDismiss, duration])

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-3 bg-base-content text-base-100 rounded-xl shadow-lg px-4 py-3 max-w-sm w-full sm:w-auto"
      >
        <span className="text-sm flex-1">{message}</span>
        {actionLabel && onAction && (
          <button
            onClick={() => { onAction(); onDismiss() }}
            className="text-sm font-bold underline underline-offset-2 shrink-0 min-h-[44px] sm:min-h-0 px-1"
          >
            {actionLabel}
          </button>
        )}
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-base-100/70 hover:text-base-100 shrink-0 min-h-[44px] sm:min-h-0 px-1"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
