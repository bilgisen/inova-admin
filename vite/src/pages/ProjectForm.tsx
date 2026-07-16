import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Select } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useToast } from '../components/layout/Toast'
import { slugify } from '../lib/slug'
import { ArrowLeft, Star, X, Upload } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
}

interface MediaItem {
  id: number
  url: string
  original_name: string
  is_cover: number
  sort_order: number
}

export function ProjectForm() {
  const { id } = useParams()
  const isEdit = !!id
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: `{"${lang}":""}`,
    slug: '',
    description: '{}',
    client: '{}',
    fair_name: '{}',
    fair_date: '',
    location: '{}',
    category_id: '',
    status: 'draft',
    is_featured: 0,
    meta_title: '{}',
    meta_description: '{}',
  })

  useEffect(() => {
    api.categories.list('project').then((res) => {
      setCategories(res as Category[])
    })
  }, [])

  useEffect(() => {
    if (isEdit && id) {
      api.projects.get(Number(id)).then((res) => {
        const p = res as Record<string, unknown>
        setForm({
          title: String(p.title || `{"${lang}":""}`),
          slug: String(p.slug || ''),
          description: String(p.description || '{}'),
          client: String(p.client || '{}'),
          fair_name: String(p.fair_name || '{}'),
          fair_date: String(p.fair_date || ''),
          location: String(p.location || '{}'),
          category_id: String(p.category_id || ''),
          status: String(p.status || 'draft'),
          is_featured: Number(p.is_featured || 0),
          meta_title: String(p.meta_title || '{}'),
          meta_description: String(p.meta_description || '{}'),
        })
        const mediaData = p.media as MediaItem[] | undefined
        if (mediaData) setMedia(mediaData)
      })
    }
  }, [isEdit, id, lang])

  const getJsonField = (jsonStr: string) => {
    try { return JSON.parse(jsonStr) } catch { return { [lang]: '' } }
  }

  const setJsonField = (jsonStr: string, value: string) => {
    const obj = getJsonField(jsonStr)
    obj[lang] = value
    return JSON.stringify(obj)
  }

  const getValue = (jsonStr: string) => {
    const obj = getJsonField(jsonStr)
    return obj[lang] || obj['en'] || ''
  }

  const parseJsonFields = (obj: typeof form) => {
    const fields = ['title', 'description', 'client', 'fair_name', 'location', 'meta_title', 'meta_description'] as const
    const parsed: Record<string, unknown> = { ...obj }
    for (const key of fields) {
      try { parsed[key] = JSON.parse(obj[key]) } catch { parsed[key] = {} }
    }
    return parsed
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...parseJsonFields(form),
        category_id: form.category_id ? Number(form.category_id) : null,
        is_featured: Number(form.is_featured),
        sort_order: 0,
      }

      if (isEdit && id) {
        await api.projects.update(Number(id), data)
        toast(t('common.success'), 'success')
        navigate('/projects')
      } else {
        const created = await api.projects.create(data)
        toast(t('common.success'), 'success')
        navigate(`/projects/${(created as Record<string, unknown>).id}`)
      }
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSetCover = async (mediaId: number) => {
    try {
      await api.media.update(mediaId, { is_cover: 1 })
      setMedia((prev) => prev.map((m) => ({ ...m, is_cover: m.id === mediaId ? 1 : 0 })))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleRemoveMedia = async (mediaId: number) => {
    try {
      await api.media.delete(mediaId)
      setMedia((prev) => prev.filter((m) => m.id !== mediaId))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleDragStart = (index: number) => setDragIndex(index)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add('ring-2', 'ring-primary')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('ring-2', 'ring-primary')
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove('ring-2', 'ring-primary')
    if (dragIndex === null || dragIndex === dropIndex) return

    const updated = [...media]
    const [moved] = updated.splice(dragIndex, 1)
    updated.splice(dropIndex, 0, moved)
    const reordered = updated.map((m, i) => ({ ...m, sort_order: i }))
    setMedia(reordered)
    setDragIndex(null)

    try {
      await api.media.reorder(reordered.map((m) => ({ id: m.id, sort_order: m.sort_order })))
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleDragEnd = () => setDragIndex(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const sig = await api.media.signature()
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('api_key', sig.api_key)
        formData.append('timestamp', String(sig.timestamp))
        formData.append('signature', sig.signature)
        formData.append('folder', sig.folder)
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`, { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadData.public_id) {
          const created = await api.media.create({
            filename: uploadData.public_id,
            original_name: file.name,
            mime_type: file.type,
            url: uploadData.secure_url,
            cloudinary_pid: uploadData.public_id,
            width: uploadData.width,
            height: uploadData.height,
            file_size: uploadData.bytes,
            project_id: Number(id),
          })
          setMedia((prev) => [...prev, created as MediaItem])
        }
      }
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold">
          {isEdit ? t('projects.editProject') : t('projects.newProject')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('projects.projectTitle')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.projectTitle')} ({lang})</label>
                  <Input
                    value={getValue(form.title)}
                    onChange={(e) => {
                      const newTitle = setJsonField(form.title, e.target.value)
                      setForm({
                        ...form,
                        title: newTitle,
                        slug: isEdit ? form.slug : slugify(getValue(newTitle)),
                      })
                    }}
                    required
                  />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.description')} ({lang})</label>
                <Textarea
                  value={getValue(form.description)}
                  onChange={(e) => setForm({ ...form, description: setJsonField(form.description, e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.client')} ({lang})</label>
                <Input
                  value={getValue(form.client)}
                  onChange={(e) => setForm({ ...form, client: setJsonField(form.client, e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.fairName')} ({lang})</label>
                <Input
                  value={getValue(form.fair_name)}
                  onChange={(e) => setForm({ ...form, fair_name: setJsonField(form.fair_name, e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.fairDate')}</label>
                <Input type="date" value={form.fair_date} onChange={(e) => setForm({ ...form, fair_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.location')} ({lang})</label>
                <Input
                  value={getValue(form.location)}
                  onChange={(e) => setForm({ ...form, location: setJsonField(form.location, e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.category')}</label>
                <Select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('common.status')}</label>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">{t('projects.draft')}</option>
                  <option value="published">{t('projects.published')}</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('projects.featured')}</label>
                <Select value={String(form.is_featured)} onChange={(e) => setForm({ ...form, is_featured: Number(e.target.value) })}>
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isEdit && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('projects.images')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button type="button" variant="outline" disabled={uploading} onClick={() => document.getElementById('project-media-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-1" />
                  {uploading ? t('common.loading') : t('media.upload')}
                </Button>
                <input id="project-media-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
              </div>
              {media.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {media.map((item, index) => (
                    <div
                      key={item.id}
                      className={`relative group cursor-grab ${dragIndex === index ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <img
                        src={item.url}
                        alt=""
                        className="w-full aspect-square object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetCover(item.id)}
                          className={`p-1 rounded ${item.is_cover ? 'text-yellow-400' : 'text-white'} hover:bg-white/20 cursor-pointer`}
                          title={t('media.setAsCover')}
                        >
                          <Star className="w-4 h-4" fill={item.is_cover ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(item.id)}
                          className="p-1 rounded text-red-400 hover:bg-white/20 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {item.is_cover ? (
                        <Badge className="absolute top-1 left-1 text-[10px] px-1 py-0">{t('media.cover')}</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/projects')}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
