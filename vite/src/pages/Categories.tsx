import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { useToast } from '../components/layout/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  type: string
  sort_order: number
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', type: 'project', sort_order: 0 })

  useEffect(() => {
    api.categories.list().then((res) => {
      setCategories(res as Category[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', slug: '', type: 'project', sort_order: 0 })
    setModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    const parsed = tryParse(cat.name)
    setForm({ name: parsed[lang] || parsed['en'] || '', slug: cat.slug, type: cat.type, sort_order: cat.sort_order })
    setModal(true)
  }

  const tryParse = (str: string) => {
    try { return JSON.parse(str) } catch { return { [lang]: str } }
  }

  const handleSave = async () => {
    const nameObj = editing ? { ...tryParse(editing.name), [lang]: form.name } : { [lang]: form.name }
    const payload = {
      name: JSON.stringify(nameObj),
      slug: form.slug,
      type: form.type,
      sort_order: form.sort_order,
    }
    try {
      if (editing) {
        await api.categories.update(editing.id, payload)
      } else {
        await api.categories.create(payload)
      }
      toast(t('common.success'), 'success')
      setModal(false)
      const res = await api.categories.list()
      setCategories(res as Category[])
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.categories.delete(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />{t('categories.newCategory')}</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('categories.name')}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>{t('categories.type')}</TableHead>
              <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('common.loading')}</TableCell></TableRow>
            ) : categories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t('common.noData')}</TableCell></TableRow>
            ) : (
              categories.map((cat) => {
                const parsed = tryParse(cat.name)
                const name = parsed[lang] || parsed['en'] || cat.name
                return (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>{cat.slug}</TableCell>
                    <TableCell>{t(`categories.${cat.type}Type`)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t('common.edit') : t('categories.newCategory')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('categories.name')} ({lang})</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('categories.type')}</label>
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="project">{t('categories.projectType')}</option>
                <option value="post">{t('categories.postType')}</option>
                <option value="page">{t('categories.pageType')}</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
