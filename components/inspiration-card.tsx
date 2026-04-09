'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface InspirationItem {
  id: string
  url: string
  imageUrl: string
  mediaType: 'image' | 'video'
  author: string
  authorHandle: string
  /** Optional profile image URL (e.g. X/Twitter avatar). */
  authorAvatarUrl?: string
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)

  useEffect(() => {
    setMediaLoaded(false)
  }, [item.id, item.imageUrl, item.mediaType])

  const isActive = isHovered || isMenuOpen

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
        isActive && 'ring-1 ring-border/50 shadow-2xl shadow-black/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Media container with natural aspect ratio */}
      <div className="relative w-full">
        {item.mediaType === 'video' ? (
          <video
            src={item.imageUrl}
            className={cn(
              'block w-full min-h-[12rem] h-auto object-cover transition-all duration-500 bg-black',
              mediaLoaded ? 'opacity-100' : 'opacity-0'
            )}
            muted
            loop
            playsInline
            autoPlay
            onLoadedData={() => setMediaLoaded(true)}
            onError={() => setMediaLoaded(true)}
            aria-label={`Inspiration by ${item.author}`}
          />
        ) : (
          <Image
            src={item.imageUrl}
            alt={`Inspiration by ${item.author}`}
            width={400}
            height={500}
            className={cn(
              'w-full h-auto object-cover transition-all duration-500',
              mediaLoaded ? 'opacity-100' : 'opacity-0'
            )}
            onLoad={() => setMediaLoaded(true)}
            unoptimized
          />
        )}

        {/* Loading skeleton */}
        {!mediaLoaded && (
          <div className="absolute inset-0 bg-secondary animate-pulse" />
        )}

        {/* Hover overlay with metadata */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Actions menu - top right */}
        {showActions ? (
          <div
            data-dropdown
            className={cn(
              'absolute top-3 right-3 transition-all duration-200 ease-out',
              isActive
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-[0.93]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu onOpenChange={setIsMenuOpen}>
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
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          <div className="flex items-end gap-2">
            <Avatar className="size-6 shrink-0 ring-1 ring-white/15">
              {item.authorAvatarUrl ? (
                <AvatarImage
                  src={item.authorAvatarUrl}
                  alt=""
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-white/15 text-xs font-medium text-white/90">
                {(item.author.trim().charAt(0) || '?').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-[11px] leading-none font-medium text-white">{item.author}</p>
              <p className="truncate text-[11px] leading-none text-white/60">@{item.authorHandle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
