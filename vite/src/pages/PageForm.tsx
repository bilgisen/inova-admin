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

export function PageForm() {
  const { id } = useParams()
  const isEdit = !!id
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: `{"${lang}":""}`, slug: '', content: '{}', status: 'draft',
  })

  useEffect(() => {
    if (isEdit && id) {
      api.pages.get(Number(id)).then((res) => {
        const p = res as Record<string, unknown>
        setForm({
          title: String(p.title || `{"${lang}":""}`),
          slug: String(p.slug || ''),
          content: String(p.content || '{}'),
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
      if (isEdit && id) {
        await api.pages.update(Number(id), form)
      } else {
        await api.pages.create(form)
      }
      toast(t('common.success'), 'success')
      navigate('/pages')
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/pages')}><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-2xl font-bold">{isEdit ? t('pages.editPage') : t('pages.newPage')}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('pages.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('pages.title')} ({lang})</label>
                <Input value={getVal(form.title)} onChange={(e) => setForm({ ...form, title: setVal(form.title, e.target.value) })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
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
              <label className="text-sm font-medium">{t('pages.content')} ({lang})</label>
              <textarea
                value={getVal(form.content)}
                onChange={(e) => setForm({ ...form, content: setVal(form.content, e.target.value) })}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[300px]"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/pages')}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={saving}>{saving ? t('common.loading') : t('common.save')}</Button>
        </div>
      </form>
    </div>
  )
}
