'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspirationCard, type InspirationItem } from '@/components/inspiration-card'
import { AddInspirationDialog } from '@/components/add-inspiration-dialog'
import { EmptyState } from '@/components/empty-state'
import { SearchBar } from '@/components/search-bar'
import { supabase } from '@/lib/supabase'

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
    const loadInspirations = async () => {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .order('created_at', { ascending: false })

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
          tags: Array.isArray(row.tags) ? row.tags : [],
        }))
        setItems(mappedItems)
      }
    }

    loadInspirations()
  }, [])

  // Filter items based on search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.authorHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })
  }, [items, searchQuery])

  const handleAddItem = async (newItem: Omit<InspirationItem, 'id'>) => {
    if (editItem) {
      const { error } = await supabase
        .from('inspirations')
        .update({
          url: newItem.url,
          image_url: newItem.imageUrl,
          author: newItem.author,
          author_handle: newItem.authorHandle,
          tags: newItem.tags,
        })
        .eq('id', editItem.id)

      if (error) {
        logSupabaseError('update inspiration', error)
        return
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === editItem.id ? { ...newItem, id: editItem.id } : item
        )
      )
      setEditItem(null)
    } else {
      const id = Date.now().toString()
      const { error } = await supabase.from('inspirations').insert({
        id,
        url: newItem.url,
        image_url: newItem.imageUrl,
        author: newItem.author,
        author_handle: newItem.authorHandle,
        tags: newItem.tags,
      })

      if (error) {
        logSupabaseError('insert inspiration', error)
        return
      }

      const item: InspirationItem = {
        ...newItem,
        id,
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-5">
          <div className="flex items-center justify-between gap-6">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold tracking-tight">Digital Inspo</h1>
            </div>

            {isAdmin && (
              <div className="flex flex-shrink-0 items-center gap-2">
                <Button
                  onClick={handleOpenAddDialog}
                  size="default"
                  className="rounded-full gap-2 px-5"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add new</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => supabase.auth.signOut()}
                >
                  Sign out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-[1800px] mx-auto px-6 lg:px-12 py-8">
        {items.length === 0 ? (
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

      {/* Floating Search Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          className="shadow-lg shadow-black/20"
        />
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
