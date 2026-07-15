import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { useToast } from '../components/layout/Toast'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Project {
  id: number
  title: string
  slug: string
  status: string
  sort_order: number
  is_featured: number
  category_name: string | null
  cover_image: string | null
  media_count: number
  created_at: string
}

export function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { t } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const limit = 20

  useEffect(() => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (search) params.search = search
    if (statusFilter) params.status = statusFilter

    api.projects.list(params).then((res) => {
      setProjects(res.data as Project[])
      setTotal(res.total)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page, search, statusFilter])

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.projects.delete(id)
      toast(t('common.success'), 'success')
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('projects.title')}</h2>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-1" />
          {t('projects.newProject')}
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">{t('common.all')}</option>
          <option value="draft">{t('projects.draft')}</option>
          <option value="published">{t('projects.published')}</option>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('projects.projectTitle')}</TableHead>
              <TableHead>{t('projects.category')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead>{t('projects.featured')}</TableHead>
              <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t('common.loading')}
                </TableCell>
              </TableRow>
            ) : projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t('common.noData')}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {project.cover_image && (
                        <img src={project.cover_image} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <span className="font-medium">{project.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{project.category_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                      {t(`projects.${project.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.is_featured ? <Badge variant="default">{t('projects.featured')}</Badge> : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${project.id}`)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > limit && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= Math.ceil(total / limit)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
