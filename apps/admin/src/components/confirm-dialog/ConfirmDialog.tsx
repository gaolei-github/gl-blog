import { useId } from 'react'
import './confirm-dialog.css'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  confirmTone?: 'primary' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  confirmTone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const messageId = useId()
  const descriptionId = useId()
  const describedBy = description
    ? `${messageId} ${descriptionId}`
    : messageId
  const confirmClassName =
    confirmTone === 'danger'
      ? 'confirm-dialog-confirm danger'
      : 'confirm-dialog-confirm'

  if (!isOpen) {
    return null
  }

  return (
    <div className="confirm-dialog-mask">
      <div
        className="confirm-dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
      >
        <div className="confirm-dialog-header">
          <span id={titleId}>{title}</span>
          <button
            type="button"
            className="confirm-dialog-close"
            onClick={onCancel}
          >
            关闭
          </button>
        </div>
        <div className="confirm-dialog-body">
          <div className="confirm-dialog-icon" aria-hidden="true">
            !
          </div>
          <div className="confirm-dialog-content">
            <p id={messageId} className="confirm-dialog-message">
              {message}
            </p>
            {description ? (
              <p id={descriptionId} className="confirm-dialog-description">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="confirm-dialog-cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClassName}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
