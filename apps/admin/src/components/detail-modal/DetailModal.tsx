import { useId, type ReactNode } from 'react'
import './detail-modal.css'

interface DetailModalProps {
  isOpen: boolean
  title: string
  mode?: 'view' | 'edit'
  closeLabel?: string
  cancelLabel?: string
  saveLabel?: string
  onClose: () => void
  onSave?: () => void
  children: ReactNode
}

function DetailModal({
  isOpen,
  title,
  mode = 'view',
  closeLabel = '关闭',
  cancelLabel = '取消',
  saveLabel = '保存',
  onClose,
  onSave,
  children,
}: DetailModalProps) {
  const titleId = useId()
  const isEdit = mode === 'edit'

  if (!isOpen) {
    return null
  }

  return (
    <div className="detail-modal-mask">
      <div
        className="detail-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="detail-modal-header">
          <span id={titleId}>{title}</span>
          <button
            type="button"
            className="detail-modal-close"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
        <div className="detail-modal-body">{children}</div>
        <div className="detail-modal-footer">
          {isEdit ? (
            <>
              <button
                type="button"
                className="detail-modal-secondary"
                onClick={onClose}
              >
                {cancelLabel}
              </button>
              {onSave ? (
                <button
                  type="button"
                  className="detail-modal-primary"
                  onClick={onSave}
                >
                  {saveLabel}
                </button>
              ) : null}
            </>
          ) : (
            <button
              type="button"
              className="detail-modal-secondary"
              onClick={onClose}
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailModal
