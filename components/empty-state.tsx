'use client'

import { Sparkles, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  onAddClick?: () => void
  showAddAction?: boolean
}

export function EmptyState({
  onAddClick,
  showAddAction = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="relative mb-8">
        {/* Decorative background glow */}
        <div className="absolute inset-0 blur-3xl bg-gradient-to-br from-muted/30 to-transparent rounded-full scale-150" />
        
        {/* Icon container */}
        <div className="relative p-6 rounded-3xl bg-secondary/50 border border-border/50">
          <Sparkles className="size-10 text-muted-foreground" />
        </div>
      </div>

      <h2 className="text-2xl font-medium text-foreground mb-3 text-balance">
        Your inspiration library is empty
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed text-balance">
        Start building your personal archive of design references from X/Twitter. 
        Save the posts that inspire you and find them easily later.
      </p>

      {showAddAction && onAddClick ? (
        <Button
          onClick={onAddClick}
          size="lg"
          className="h-12 px-6 rounded-xl font-medium gap-2"
        >
          <Plus className="size-5" />
          Add your first inspiration
        </Button>
      ) : null}

      {/* Subtle decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-muted/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-muted/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
