import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { useToast } from '../components/layout/Toast'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Tag {
  id: number
  name: string
  slug: string
  project_count: number
}

export function Tags() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [form, setForm] = useState({ name: '', slug: '' })

  useEffect(() => {
    api.tags.list().then((res) => {
      setTags(res as Tag[])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', slug: '' }); setModal(true) }

  const openEdit = (tag: Tag) => {
    setEditing(tag)
    const parsed = tryParse(tag.name)
    setForm({ name: parsed[lang] || parsed['en'] || '', slug: tag.slug })
    setModal(true)
  }

  const tryParse = (str: string) => {
    try { return JSON.parse(str) } catch { return { [lang]: str } }
  }

  const handleSave = async () => {
    const nameObj = editing ? { ...tryParse(editing.name), [lang]: form.name } : { [lang]: form.name }
    try {
      if (editing) {
        await api.tags.update(editing.id, { name: JSON.stringify(nameObj), slug: form.slug })
      } else {
        await api.tags.create({ name: JSON.stringify(nameObj), slug: form.slug })
      }
      toast(t('common.success'), 'success')
      setModal(false)
      const res = await api.tags.list()
      setTags(res as Tag[])
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.tags.delete(id)
      setTags((prev) => prev.filter((tag) => tag.id !== id))
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('tags.title')}</h2>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" />{t('tags.newTag')}</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('tags.name')}</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : tags.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('common.noData')}</TableCell></TableRow>
            ) : (
              tags.map((tag) => {
                const parsed = tryParse(tag.name)
                return (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{parsed[lang] || parsed['en'] || tag.name}</TableCell>
                    <TableCell>{tag.slug}</TableCell>
                    <TableCell>{tag.project_count}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tag)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
          <DialogHeader><DialogTitle>{editing ? t('common.edit') : t('tags.newTag')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('tags.name')} ({lang})</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
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
