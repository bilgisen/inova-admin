import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

interface Project {
  id: number
  title: string
  slug: string
  status: string
  sort_order: number
  is_featured: number
  created_at: string
  cover_image: string | null
  media_count: number
  category_name: string | null
  category_slug: string | null
  [key: string]: unknown
}

export function useProjects(params?: Record<string, string>) {
  const [data, setData] = useState<{ data: Project[]; total: number; page: number; totalPages: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.projects.list(params)
      setData(result as typeof data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [params])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { ...data, loading, error, refetch: fetch }
}
