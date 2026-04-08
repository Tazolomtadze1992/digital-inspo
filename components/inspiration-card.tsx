'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface InspirationItem {
  id: string
  url: string
  imageUrl: string
  author: string
  authorHandle: string
  tags: string[]
}

interface InspirationCardProps {
  item: InspirationItem
  onEdit: (item: InspirationItem) => void
  onDelete: (id: string) => void
  /** When false, edit/delete menu is hidden (public browse). */
  showActions?: boolean
}

export function InspirationCard({
  item,
  onEdit,
  onDelete,
  showActions = true,
}: InspirationCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open link if clicking on the dropdown
    if ((e.target as HTMLElement).closest('[data-dropdown]')) {
      return
    }
    window.open(item.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-2xl bg-card transition-all duration-300 ease-out',
        'hover:ring-1 hover:ring-border/50',
        isHovered && 'scale-[1.02] shadow-2xl shadow-black/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Image container with natural aspect ratio */}
      <div className="relative w-full">
        <Image
          src={item.imageUrl}
          alt={`Inspiration by ${item.author}`}
          width={400}
          height={500}
          className={cn(
            'w-full h-auto object-cover transition-all duration-500',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          unoptimized
        />
        
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        )}

        {/* Hover overlay with metadata */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Actions menu - top right */}
        {showActions ? (
          <div
            data-dropdown
            className={cn(
              'absolute top-3 right-3 transition-all duration-300',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                  <MoreHorizontal className="size-3.5 text-white/80" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}

        {/* Bottom metadata */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-4 transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          {/* Author info */}
          <div>
            <p className="text-sm font-medium text-white">{item.author}</p>
            <p className="text-xs text-white/60">@{item.authorHandle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
