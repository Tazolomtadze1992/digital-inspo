'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Upload, X, Link as LinkIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { normalizeTags } from '@/lib/tags'
import type { InspirationItem } from './inspiration-card'

interface AddInspirationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: Omit<InspirationItem, 'id'>) => void
  editItem?: InspirationItem | null
  /** Unique tags from the library (lowercase); used for inline suggestions. */
  suggestedTags?: string[]
}

export function AddInspirationDialog({
  open,
  onOpenChange,
  onSave,
  editItem,
  suggestedTags = [],
}: AddInspirationDialogProps) {
  const [url, setUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  /** Whether `imagePreview` should be shown as an `<img>` or `<video>`. */
  const [previewKind, setPreviewKind] = useState<'image' | 'video'>('image')
  const [author, setAuthor] = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  /** Lets the user dismiss the tag picker without clearing typed text; resets on input focus/change. */
  const [tagPickerDismissed, setTagPickerDismissed] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  /** Tracks blob: URLs we created for local video preview (must be revoked). */
  const previewBlobUrlRef = useRef<string | null>(null)

  const revokePreviewBlobUrl = () => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current)
      previewBlobUrlRef.current = null
    }
  }

  const resetForm = () => {
    revokePreviewBlobUrl()
    setUrl('')
    setImagePreview(null)
    setPreviewKind('image')
    setSelectedFile(null)
    setAuthor('')
    setAuthorHandle('')
    setAuthorAvatarUrl('')
    setTagInput('')
    setTags([])
    setTagPickerDismissed(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      revokePreviewBlobUrl()
      setUrl(editItem.url)
      setImagePreview(editItem.imageUrl)
      setPreviewKind(editItem.mediaType === 'video' ? 'video' : 'image')
      setSelectedFile(null)
      setAuthor(editItem.author)
      setAuthorHandle(editItem.authorHandle)
      setAuthorAvatarUrl(editItem.authorAvatarUrl ?? '')
      setTags(normalizeTags(editItem.tags))
      setTagInput('')
      setTagPickerDismissed(false)
    } else {
      resetForm()
    }
  }, [editItem, open])

  useEffect(() => {
    setTagPickerDismissed(false)
  }, [tagInput])

  useEffect(() => {
    return () => {
      revokePreviewBlobUrl()
    }
  }, [])

  const handleFileSelect = (file: File) => {
    if (!file) return

    if (file.type.startsWith('image/')) {
      revokePreviewBlobUrl()
      setSelectedFile(file)
      setPreviewKind('image')
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      return
    }

    if (file.type.startsWith('video/')) {
      revokePreviewBlobUrl()
      setSelectedFile(file)
      setPreviewKind('video')
      const objectUrl = URL.createObjectURL(file)
      previewBlobUrlRef.current = objectUrl
      setImagePreview(objectUrl)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase()
    if (!t || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput('')
    setTagPickerDismissed(false)
    requestAnimationFrame(() => tagInputRef.current?.focus())
  }

  const query = tagInput.trim().toLowerCase()
  const matchingSuggestions = suggestedTags.filter(
    (t) => t.includes(query) && !tags.includes(t)
  )
  const showCreateOption =
    query.length >= 1 &&
    !tags.includes(query) &&
    !matchingSuggestions.includes(query)

  const tagPickerOpen =
    query.length >= 1 &&
    !tagPickerDismissed &&
    (matchingSuggestions.length > 0 || showCreateOption)

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput)
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      e.preventDefault()
      setTags((prev) => prev.slice(0, -1))
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !imagePreview || !author) return

    let imageUrl = imagePreview
    let mediaType: 'image' | 'video'

    if (selectedFile) {
      setIsUploading(true)
      try {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniquePath = `${Date.now()}-${safeName}`

        const { error } = await supabase.storage
          .from('inspiration-images')
          .upload(uniquePath, selectedFile, {
            contentType: selectedFile.type || undefined,
          })

        if (error) {
          const err = error as Error & {
            details?: string
            hint?: string
            code?: string
          }
          console.error('Storage upload failed:', {
            message: err.message,
            details: err.details,
            hint: err.hint,
            code: err.code,
          })
          return
        }

        const { data } = supabase.storage
          .from('inspiration-images')
          .getPublicUrl(uniquePath)
        imageUrl = data.publicUrl
        mediaType = selectedFile.type.startsWith('video/') ? 'video' : 'image'
      } finally {
        setIsUploading(false)
      }
    } else {
      mediaType = editItem?.mediaType ?? 'image'
    }

    const tagsForSave = normalizeTags([
      ...tags,
      ...(tagInput.trim() ? [tagInput] : []),
    ])

    onSave({
      url,
      imageUrl,
      mediaType,
      author,
      authorHandle: authorHandle || author.toLowerCase().replace(/\s+/g, ''),
      authorAvatarUrl: authorAvatarUrl.trim() || undefined,
      tags: tagsForSave,
    })

    resetForm()
    onOpenChange(false)
  }

  const isValid = url && imagePreview && author

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[480px] border border-border bg-popover shadow-none [&>button]:top-6 [&>button]:right-6"
        style={{
          boxShadow:
            '0 1px 0.6px 1px rgb(255 255 255 / 0.08), inset 0 3px 1px 0 rgb(0 0 0 / 0.41), inset 1px 1px 0.25px 0 rgb(255 255 255 / 0.11)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-medium leading-none">
            {editItem ? 'Edit Inspiration' : 'Add Inspiration'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editItem ? 'Edit the details of your saved inspiration' : 'Save a new design inspiration to your library'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs text-muted-foreground">
              X/Twitter Post URL
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 bg-input border-muted-foreground/10 rounded-full"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Thumbnail</Label>
            <div
              className={cn(
                'relative border-2 border-dashed rounded-xl transition-colors cursor-pointer',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/15 hover:border-muted-foreground/50',
                imagePreview ? 'p-0' : 'p-8'
              )}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {imagePreview ? (
                <div className="relative">
                  {previewKind === 'video' ? (
                    <video
                      src={imagePreview}
                      controls
                      muted
                      playsInline
                      className="w-full h-48 object-cover rounded-xl bg-black"
                    />
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      revokePreviewBlobUrl()
                      setImagePreview(null)
                      setPreviewKind('image')
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 transition-colors"
                  >
                    <X className="size-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 rounded-full bg-secondary">
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">Drop an image or video here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Author Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="author" className="text-xs text-muted-foreground">
                Author Name
              </Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-input border-muted-foreground/10 rounded-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle" className="text-xs text-muted-foreground">
                Handle (optional)
              </Label>
              <Input
                id="handle"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value.replace('@', ''))}
                className="bg-input border-muted-foreground/10 rounded-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="author-avatar-url"
              className="text-xs text-muted-foreground"
            >
              Author avatar URL{' '}
              <span className="text-xs text-muted-foreground/70">(optional)</span>
            </Label>
            <Input
              id="author-avatar-url"
              type="url"
              inputMode="url"
              value={authorAvatarUrl}
              onChange={(e) => setAuthorAvatarUrl(e.target.value)}
              className="bg-input border-muted-foreground/10 rounded-full"
            />
          </div>

          {/* Tags — inline chips + combobox suggestions */}
          <div className="space-y-2">
            <Label htmlFor="tags-input" className="text-xs text-muted-foreground">
              Tags
            </Label>
            <Popover
              modal={false}
              open={tagPickerOpen}
              onOpenChange={(next) => {
                if (!next) setTagPickerDismissed(true)
              }}
            >
              <PopoverAnchor asChild>
                <div className="w-full">
                  <div
                    className={cn(
                      'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-full border border-muted-foreground/10 bg-input px-3 py-1.5 text-sm shadow-xs transition-[color,box-shadow] outline-none',
                      'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]'
                    )}
                    onClick={() => tagInputRef.current?.focus()}
                  >
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="shrink-0 rounded-full border border-accent bg-secondary px-2 py-1 text-xs font-normal text-muted-foreground/70 transition-colors hover:text-foreground"
                        asChild
                      >
                        <button
                          type="button"
                          className="group inline-flex max-w-full items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveTag(tag)
                          }}
                        >
                          <span className="truncate">{tag}</span>
                          <X className="size-3 opacity-70 transition-colors group-hover:text-foreground" />
                        </button>
                      </Badge>
                    ))}
                    <input
                      ref={tagInputRef}
                      id="tags-input"
                      type="text"
                      autoComplete="off"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      onFocus={() => setTagPickerDismissed(false)}
                      className="min-w-[10ch] flex-1 bg-transparent py-0.5 text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </PopoverAnchor>
              <PopoverContent
                align="start"
                sideOffset={4}
                className="z-[60] w-[var(--radix-popover-anchor-width)] border border-muted-foreground/10 p-2"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <Command shouldFilter={false} className="max-h-[240px]">
                  <CommandList className="p-1">
                    {matchingSuggestions.map((t) => (
                      <CommandItem
                        key={t}
                        value={t}
                        onSelect={() => addTag(t)}
                        className="cursor-pointer"
                      >
                        <span className="truncate">{t}</span>
                      </CommandItem>
                    ))}
                    {showCreateOption && (
                      <CommandItem
                        value={`create-${query}`}
                        onSelect={() => addTag(query)}
                        className="cursor-pointer"
                      >
                        <Plus className="size-3.5 shrink-0 opacity-70" />
                        <span>
                          Create &quot;{query}&quot; tag
                        </span>
                      </CommandItem>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isUploading}
            className="w-full h-11 rounded-xl font-medium"
          >
            {isUploading ? (
              <>
                <Spinner />
                {editItem ? 'Saving...' : 'Adding...'}
              </>
            ) : editItem ? (
              'Save Changes'
            ) : (
              'Add to Library'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
