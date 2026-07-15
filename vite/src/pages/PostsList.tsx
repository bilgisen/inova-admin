import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { useToast } from '../components/layout/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Post {
  id: number
  title: string
  slug: string
  status: string
  category_name: string | null
  created_at: string
}

export function PostsList() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    api.posts.list({ page: String(page), limit: String(limit) }).then((res) => {
      setPosts(res.data as Post[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.posts.delete(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('posts.title')}</h2>
        <Button onClick={() => navigate('/posts/new')}><Plus className="w-4 h-4 mr-1" />{t('posts.newPost')}</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('posts.title')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('categories.title')}</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : posts.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              posts.map((post) => {
                const parsed = tryParse(post.title)
                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{parsed.en || parsed.tr || post.slug}</TableCell>
                    <TableCell><Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{t(`projects.${post.status}`)}</Badge></TableCell>
                    <TableCell>{post.category_name || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.created_at?.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/posts/${post.id}`)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      {posts.length === limit && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground">Page {page}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}

function tryParse(str: string) {
  try { return JSON.parse(str) } catch { return { en: str } }
}
