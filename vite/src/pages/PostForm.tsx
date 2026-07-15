import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useToast } from '../components/layout/Toast'
import { ArrowLeft } from 'lucide-react'

export function PostForm() {
  const { id } = useParams()
  const isEdit = !!id
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [form, setForm] = useState({
    title: `{"${lang}":""}`, slug: '', content: '{}', excerpt: '{}',
    category_id: '', status: 'draft',
  })

  useEffect(() => {
    api.categories.list('post').then((res) => setCategories(res as { id: number; name: string }[]))
    if (isEdit && id) {
      api.posts.get(Number(id)).then((res) => {
        const p = res as Record<string, unknown>
        setForm({
          title: String(p.title || `{"${lang}":""}`),
          slug: String(p.slug || ''),
          content: String(p.content || '{}'),
          excerpt: String(p.excerpt || '{}'),
          category_id: String(p.category_id || ''),
          status: String(p.status || 'draft'),
        })
      })
    }
  }, [isEdit, id, lang])

  const getVal = (jsonStr: string) => {
    try { return JSON.parse(jsonStr)[lang] || JSON.parse(jsonStr)['en'] || '' } catch { return '' }
  }
  const setVal = (jsonStr: string, val: string) => {
    const obj = (() => { try { return JSON.parse(jsonStr) } catch { return {} } })()
    obj[lang] = val
    return JSON.stringify(obj)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, category_id: form.category_id ? Number(form.category_id) : null }
      if (isEdit && id) {
        await api.posts.update(Number(id), data)
      } else {
        await api.posts.create(data)
      }
      toast(t('common.success'), 'success')
      navigate('/posts')
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/posts')}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-2xl font-bold">{isEdit ? t('posts.editPost') : t('posts.newPost')}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('posts.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('posts.title')} ({lang})</label>
                <Input value={getVal(form.title)} onChange={(e) => setForm({ ...form, title: setVal(form.title, e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('posts.excerpt')} ({lang})</label>
                <Input value={getVal(form.excerpt)} onChange={(e) => setForm({ ...form, excerpt: setVal(form.excerpt, e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.category')}</label>
                <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.status')}</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">{t('projects.draft')}</option>
                  <option value="published">{t('projects.published')}</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('posts.content')} ({lang})</label>
              <textarea
                value={getVal(form.content)}
                onChange={(e) => setForm({ ...form, content: setVal(form.content, e.target.value) })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[200px]"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/posts')}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
