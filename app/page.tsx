'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspirationCard, type InspirationItem } from '@/components/inspiration-card'
import { AddInspirationDialog } from '@/components/add-inspiration-dialog'
import { EmptyState } from '@/components/empty-state'
import { SearchBar } from '@/components/search-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'
import { normalizeTags } from '@/lib/tags'

const ADMIN_USER_ID = '0e4963ee-0ce1-4f08-bf6f-d77583642f18'

function logSupabaseError(
  action: string,
  error: { message: string; details?: string; hint?: string; code?: string }
) {
  console.error(`Supabase ${action} failed:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  })
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [items, setItems] = useState<InspirationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<InspirationItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = session?.user?.id === ADMIN_USER_ID

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadInspirations = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('inspirations')
          .select('*')
          .order('created_at', { ascending: false })

        if (cancelled) return

        if (error) {
          logSupabaseError('load inspirations', error)
          return
        }

        if (data) {
          const mappedItems: InspirationItem[] = data.map((row) => ({
            id: String(row.id),
            url: row.url as string,
            imageUrl: row.image_url as string,
            author: row.author as string,
            authorHandle: row.author_handle as string,
            tags: normalizeTags(row.tags),
          }))
          setItems(mappedItems)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadInspirations()
    return () => {
      cancelled = true
    }
  }, [])

  // Filter items: author, handle, post URL, and tags (case-insensitive substring)
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q === '') return items

    return items.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : []
      return (
        item.author.toLowerCase().includes(q) ||
        item.authorHandle.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        tags.some((tag) =>
          String(tag).toLowerCase().includes(q)
        )
      )
    })
  }, [items, searchQuery])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        const t = String(tag).trim().toLowerCase()
        if (t) set.add(t)
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [items])

  const handleAddItem = async (newItem: Omit<InspirationItem, 'id'>) => {
    const tags = normalizeTags(newItem.tags)
    const payload = {
      url: newItem.url,
      image_url: newItem.imageUrl,
      author: newItem.author,
      author_handle: newItem.authorHandle,
      tags,
    }

    if (editItem) {
      const { error } = await supabase
        .from('inspirations')
        .update(payload)
        .eq('id', editItem.id)

      if (error) {
        logSupabaseError('update inspiration', error)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === editItem.id
            ? { ...newItem, id: editItem.id, tags }
            : item
        )
      )
      setEditItem(null)
    } else {
      const id = Date.now().toString()
      const { error } = await supabase.from('inspirations').insert({
        id,
        ...payload,
      })

      if (error) {
        logSupabaseError('insert inspiration', error)
        return
      }

      const item: InspirationItem = {
        ...newItem,
        id,
        tags,
      }
      setItems((prev) => [item, ...prev])
    }
  }

  const handleEditItem = (item: InspirationItem) => {
    setEditItem(item)
    setIsAddDialogOpen(true)
  }

  const handleDeleteItem = async (id: string) => {
    const { error } = await supabase.from('inspirations').delete().eq('id', id)

    if (error) {
      logSupabaseError('delete inspiration', error)
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleOpenAddDialog = () => {
    setEditItem(null)
    setIsAddDialogOpen(true)
  }

  return (
    <main className="min-h-screen bg-background pb-28">
      {/* Main content */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-8">
        {isLoading ? (
          <div
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-5 [column-fill:_balance]"
            aria-busy="true"
            aria-label="Loading inspirations"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="mb-5 break-inside-avoid">
                <Skeleton
                  className={
                    [
                      'h-52 w-full rounded-2xl bg-secondary/50',
                      'h-72 w-full rounded-2xl bg-secondary/50',
                      'h-64 w-full rounded-2xl bg-secondary/50',
                      'h-80 w-full rounded-2xl bg-secondary/50',
                      'h-56 w-full rounded-2xl bg-secondary/50',
                      'h-60 w-full rounded-2xl bg-secondary/50',
                    ][i % 6]
                  }
                />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            onAddClick={handleOpenAddDialog}
            showAddAction={isAdmin}
          />
        ) : (
          <>
            {/* Masonry Grid */}
            {filteredItems.length > 0 ? (
              <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5 gap-5 [column-fill:_balance]">
                {filteredItems.map((item) => (
                  <div key={item.id} className="mb-5 break-inside-avoid">
                    <InspirationCard
                      item={item}
                      onEdit={handleEditItem}
                      onDelete={handleDeleteItem}
                      showActions={isAdmin}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-muted-foreground">
                  No results found for your search
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Search: viewport-centered; + sits to its right (gap-4); sign-out stays right-anchored */}
      <div className="fixed bottom-6 left-0 right-0 z-50 min-h-12 overflow-visible pointer-events-none">
        <div className="pointer-events-auto absolute left-1/2 top-1/2 w-full max-w-xl -translate-x-1/2 -translate-y-1/2 px-6">
          <div className="relative w-full">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              suggestedTags={allTags}
            />
            {isAdmin ? (
              <button
                type="button"
                onClick={handleOpenAddDialog}
                className="admin-sculpt-btn admin-sculpt-btn--quiet absolute left-full top-1/2 ml-4 -translate-y-1/2"
                aria-label="Add inspiration"
                title="Add inspiration"
              >
                <Plus className="size-4" strokeWidth={1.75} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
        {isAdmin ? (
          <div className="pointer-events-auto absolute right-6 top-1/2 -translate-y-1/2 sm:right-8 lg:right-12">
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="admin-sculpt-btn admin-sculpt-btn--quiet"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {/* Add/Edit Dialog */}
      <AddInspirationDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setEditItem(null)
        }}
        onSave={handleAddItem}
        editItem={editItem}
      />
    </main>
  )
}
