'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, Link as LinkIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import type { InspirationItem } from './inspiration-card'

interface AddInspirationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (item: Omit<InspirationItem, 'id'>) => void
  editItem?: InspirationItem | null
}

export function AddInspirationDialog({
  open,
  onOpenChange,
  onSave,
  editItem,
}: AddInspirationDialogProps) {
  const [url, setUrl] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [author, setAuthor] = useState('')
  const [authorHandle, setAuthorHandle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setUrl('')
    setImagePreview(null)
    setSelectedFile(null)
    setAuthor('')
    setAuthorHandle('')
    setTagInput('')
    setTags([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      setUrl(editItem.url)
      setImagePreview(editItem.imageUrl)
      setSelectedFile(null)
      setAuthor(editItem.author)
      setAuthorHandle(editItem.authorHandle)
      setTags(editItem.tags)
    } else {
      resetForm()
    }
  }, [editItem, open])

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim().toLowerCase())) {
        setTags([...tags, tagInput.trim().toLowerCase()])
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !imagePreview || !author) return

    let imageUrl = imagePreview

    if (selectedFile) {
      setIsUploading(true)
      try {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const uniquePath = `${Date.now()}-${safeName}`

        const { error } = await supabase.storage
          .from('inspiration-images')
          .upload(uniquePath, selectedFile)

        if (error) {
          const e = error as Error & {
            details?: string
            hint?: string
            code?: string
          }
          console.error('Storage upload failed:', {
            message: e.message,
            details: e.details,
            hint: e.hint,
            code: e.code,
          })
          return
        }

        const { data } = supabase.storage
          .from('inspiration-images')
          .getPublicUrl(uniquePath)
        imageUrl = data.publicUrl
      } finally {
        setIsUploading(false)
      }
    }

    onSave({
      url,
      imageUrl,
      author,
      authorHandle: authorHandle || author.toLowerCase().replace(/\s+/g, ''),
      tags,
    })

    resetForm()
    onOpenChange(false)
  }

  const isValid = url && imagePreview && author

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-popover border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">
            {editItem ? 'Edit Inspiration' : 'Add Inspiration'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {editItem ? 'Edit the details of your saved inspiration' : 'Save a new design inspiration to your library'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm text-muted-foreground">
              X/Twitter Post URL
            </Label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="url"
                placeholder="https://x.com/username/status/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Thumbnail</Label>
            <div
              className={cn(
                'relative border-2 border-dashed rounded-xl transition-colors cursor-pointer',
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50',
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
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setImagePreview(null)
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
                    <p className="text-sm text-foreground">Drop an image here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Author Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="author" className="text-sm text-muted-foreground">
                Author Name
              </Label>
              <Input
                id="author"
                placeholder="John Doe"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="handle" className="text-sm text-muted-foreground">
                Handle (optional)
              </Label>
              <Input
                id="handle"
                placeholder="@johndoe"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value.replace('@', ''))}
                className="bg-input border-border"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm text-muted-foreground">
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Press Enter to add tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="bg-input border-border"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="px-2.5 py-1 text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="size-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!isValid || isUploading}
            className="w-full h-11 rounded-xl font-medium"
          >
            {editItem ? 'Save Changes' : 'Add to Library'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
