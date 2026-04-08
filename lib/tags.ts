/**
 * Normalize tags from DB, API, or form state into a deduped lowercase string[].
 */
export function normalizeTags(value: unknown): string[] {
  if (value == null) return []

  if (Array.isArray(value)) {
    const out = value
      .map((v) => (typeof v === 'string' ? v : String(v)).trim())
      .filter((t) => t.length > 0)
      .map((t) => t.toLowerCase())
    return [...new Set(out)]
  }

  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s) as unknown
        return normalizeTags(parsed)
      } catch {
        /* treat as plain text */
      }
    }
    const out = s
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => t.toLowerCase())
    return [...new Set(out)]
  }

  return []
}
