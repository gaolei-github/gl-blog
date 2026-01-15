import type { ReactNode } from 'react'
import './data-card-grid.css'

interface DataCardGridProps {
  isEmpty: boolean
  emptyMessage: string
  children: ReactNode
  className?: string
}

function DataCardGrid({
  isEmpty,
  emptyMessage,
  children,
  className,
}: DataCardGridProps) {
  const gridClassName = ['data-card-grid', className]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={gridClassName}>
      {isEmpty ? (
        <div className="data-card-empty">{emptyMessage}</div>
      ) : (
        children
      )}
    </div>
  )
}

interface DataCardProps {
  title: string
  description?: string
  statusLabel?: string
  statusTone?: 'enabled' | 'disabled'
  meta?: ReactNode
  actions?: ReactNode
  onClick?: () => void
  isSelected?: boolean
  ariaPressed?: boolean
  className?: string
  useButton?: boolean
}

function DataCard({
  title,
  description,
  statusLabel,
  statusTone,
  meta,
  actions,
  onClick,
  isSelected = false,
  ariaPressed,
  className,
  useButton,
}: DataCardProps) {
  const isInteractive = Boolean(onClick)
  const shouldUseButton = useButton ?? isInteractive
  const cardClassName = [
    'data-card',
    isInteractive ? 'interactive' : '',
    isSelected ? 'selected' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const cardBody = (
    <>
      <div className="data-card-header">
        <div>
          <div className="data-card-title">{title}</div>
          {description ? (
            <div className="data-card-description">{description}</div>
          ) : null}
        </div>
        {statusLabel ? (
          <span
            className={`data-card-status ${statusTone ?? 'enabled'}`}
          >
            {statusLabel}
          </span>
        ) : null}
      </div>
      {meta ? <div className="data-card-meta">{meta}</div> : null}
      {actions ? (
        <div className="data-card-actions">{actions}</div>
      ) : null}
    </>
  )

  if (shouldUseButton) {
    return (
      <button
        type="button"
        className={cardClassName}
        onClick={onClick}
        aria-pressed={ariaPressed}
      >
        {cardBody}
      </button>
    )
  }

  return (
    <div
      className={cardClassName}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-pressed={isInteractive ? ariaPressed : undefined}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
    >
      {cardBody}
    </div>
  )
}

export { DataCardGrid, DataCard }
