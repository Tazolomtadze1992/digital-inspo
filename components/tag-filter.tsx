'use client'

import { cn } from '@/lib/utils'

interface TagFilterProps {
  tags: string[]
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
}

export function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectTag(null)}
        className={cn(
          'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
          selectedTag === null
            ? 'bg-foreground text-background'
            : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
        )}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize',
            selectedTag === tag
              ? 'bg-foreground text-background'
              : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
          )}
        >
          {tag}
        </button>
      ))}
    </div>
  )
}
