import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type AdminAddInspirationButtonProps = {
  onClick: () => void
  className?: string
}

export function AdminAddInspirationButton({
  onClick,
  className,
}: AdminAddInspirationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('admin-sculpt-btn admin-sculpt-btn--quiet', className)}
      aria-label="Add inspiration"
      title="Add inspiration"
    >
      <Plus className="size-4" strokeWidth={1.75} aria-hidden />
    </button>
  )
}
