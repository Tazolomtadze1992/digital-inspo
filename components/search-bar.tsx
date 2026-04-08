'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  return (
    <div className={cn('relative w-full max-w-2xl rounded-full overflow-hidden border border-border', className)}>
      <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 z-10" />
      <input
        type="text"
        placeholder="Search bookmarks, tags, authors..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full h-12 pl-12 pr-12 rounded-full',
          'bg-secondary border-0',
          'text-foreground placeholder:text-muted-foreground/50',
          'focus:outline-none focus:ring-0',
          'transition-all duration-200'
        )}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="size-4 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}
