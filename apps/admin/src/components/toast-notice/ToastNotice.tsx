import { useEffect, useRef } from 'react'
import './toast-notice.css'

type ToastTone = 'success' | 'error'

interface ToastNoticeProps {
  isOpen: boolean
  message: string
  tone?: ToastTone
  duration?: number
  onClose?: () => void
}

function ToastNotice({
  isOpen,
  message,
  tone = 'success',
  duration = 1600,
  onClose,
}: ToastNoticeProps) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      onClose?.()
    }, duration)
  }, [duration, isOpen, onClose])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <div className="toast-notice-wrap" aria-live="polite">
      <div
        className={`toast-notice-card ${
          tone === 'error' ? 'error' : 'success'
        }`}
        role="status"
      >
        {message}
      </div>
    </div>
  )
}

export default ToastNotice
