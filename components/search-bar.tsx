'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  /** Unique tags from loaded data; shown as suggestions when the input is focused */
  suggestedTags?: string[]
  className?: string
}

export function SearchBar({
  value,
  onChange,
  suggestedTags = [],
  className,
}: SearchBarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const hasSuggestions = suggestedTags.length > 0
  const showPanel = panelOpen && hasSuggestions

  useEffect(() => {
    if (!showPanel) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPanel])

  useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [panelOpen])

  useEffect(() => {
    if (!hasSuggestions) return
    if (document.activeElement !== inputRef.current) return
    setPanelOpen(true)
  }, [hasSuggestions, suggestedTags.length])

  const selectTag = (tag: string) => {
    onChange(tag)
    setPanelOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div ref={rootRef} className={cn('relative w-full max-w-2xl', className)}>
      {showPanel ? (
        <div
          className="absolute bottom-full left-0 right-0 z-[60] mb-2 px-3 py-1.5"
          role="listbox"
          aria-label="Tag suggestions"
        >
          <div className="flex max-h-[min(40vh,14rem)] flex-wrap gap-2 overflow-y-auto">
            {suggestedTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                asChild
                className="cursor-pointer rounded-full border border-accent bg-secondary px-4 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <button
                  type="button"
                  role="option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectTag(tag)}
                >
                  {tag}
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full border border-border bg-secondary'
        )}
        style={{
          boxShadow:
            '0 1px 0.6px 1px rgb(255 255 255 / 0.08), inset 0 3px 1px 0 rgb(0 0 0 / 0.41), inset 1px 1px 0.25px 0 rgb(255 255 255 / 0.11)',
        }}
      >
        <Search className="absolute left-5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground/70" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search bookmarks, tags, authors..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (hasSuggestions) setPanelOpen(true)
          }}
          onBlur={() => {
            requestAnimationFrame(() => {
              if (!rootRef.current?.contains(document.activeElement)) {
                setPanelOpen(false)
              }
            })
          }}
          className={cn(
            'h-12 w-full rounded-full border-0 bg-transparent pl-12 pr-12',
            'text-foreground placeholder:text-muted-foreground/50',
            'transition-all duration-200 focus:outline-none focus:ring-0'
          )}
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="group absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5"
          >
            <X className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
