import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

interface MediaItem {
  id: number
  url: string
  filename: string
  original_name: string
  mime_type: string
  alt_text: string
  caption: string
  is_cover: number
  sort_order: number
  width: number
  height: number
  created_at: string
  [key: string]: unknown
}

export function useMedia(params?: Record<string, string>) {
  const [data, setData] = useState<{ data: MediaItem[]; total: number; page: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.media.list(params)
      setData(result as typeof data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...data, loading, refetch: fetch }
}
