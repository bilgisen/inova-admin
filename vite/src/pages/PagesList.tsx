import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { useToast } from '../components/layout/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Page {
  id: number
  title: string
  slug: string
  status: string
  created_at: string
}

export function PagesList() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    api.pages.list().then((res) => {
      setPages(res.data as Page[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.pages.delete(id)
      setPages((prev) => prev.filter((p) => p.id !== id))
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('pages.title')}</h2>
        <Button onClick={() => navigate('/pages/new')}><Plus className="w-4 h-4 mr-1" />{t('pages.newPage')}</Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('pages.title')}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : pages.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              pages.map((page) => {
                const parsed = tryParse(page.title)
                return (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{parsed.en || parsed.tr || page.slug}</TableCell>
                    <TableCell>{page.slug}</TableCell>
                    <TableCell><Badge variant={page.status === 'published' ? 'default' : 'secondary'}>{t(`projects.${page.status}`)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{page.created_at?.slice(0, 10)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/pages/${page.id}`)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(page.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function tryParse(str: string) {
  try { return JSON.parse(str) } catch { return { en: str } }
}
