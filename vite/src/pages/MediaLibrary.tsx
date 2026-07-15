import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { useToast } from '../components/layout/Toast'
import { Upload, Trash2, Star, X } from 'lucide-react'

interface MediaItem {
  id: number
  url: string
  filename: string
  original_name: string
  alt_text: string
  caption: string
  is_cover: number
  sort_order: number
  width: number
  height: number
  created_at: string
}

export function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editItem, setEditItem] = useState<MediaItem | null>(null)
  const [editAlt, setEditAlt] = useState('')
  const [editCaption, setEditCaption] = useState('')
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 50

  const fetchMedia = useCallback(() => {
    setLoading(true)
    api.media.list({ page: String(page), limit: String(limit) }).then((res) => {
      setMedia(res.data as MediaItem[])
      setTotal(res.total)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [page])

  useEffect(() => { fetchMedia() }, [fetchMedia])

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

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloud_name}/auto/upload`,
          { method: 'POST', body: formData }
        )
        const uploadData = await uploadRes.json()

        if (uploadData.public_id) {
          await api.media.create({
            filename: uploadData.public_id,
            original_name: file.name,
            mime_type: file.type,
            url: uploadData.secure_url,
            cloudinary_pid: uploadData.public_id,
            width: uploadData.width,
            height: uploadData.height,
            file_size: uploadData.bytes,
          })
        }
      }

      toast(t('common.success'), 'success')
      fetchMedia()
    } catch {
      toast(t('common.error'), 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (item: MediaItem) => {
    if (!window.confirm(t('common.confirmDelete'))) return
    try {
      await api.media.delete(item.id)
      setMedia((prev) => prev.filter((m) => m.id !== item.id))
      toast(t('common.success'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const handleSaveEdit = async () => {
    if (!editItem) return
    try {
      await api.media.update(editItem.id, {
        alt_text: JSON.stringify({ ...JSON.parse(editItem.alt_text || '{}'), [lang]: editAlt }),
        caption: JSON.stringify({ ...JSON.parse(editItem.caption || '{}'), [lang]: editCaption }),
      })
      toast(t('common.success'), 'success')
      setEditItem(null)
      fetchMedia()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const getField = (jsonStr: string) => {
    try { return JSON.parse(jsonStr)[lang] || '' } catch { return '' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t('media.title')}</h2>
        <div className="relative">
          <Button disabled={uploading} onClick={() => document.getElementById('media-upload')?.click()}>
            <Upload className="w-4 h-4 mr-1" />
            {uploading ? t('common.loading') : t('media.upload')}
          </Button>
          <input
            id="media-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12">{t('common.loading')}</div>
      ) : media.length === 0 ? (
        <div className="text-center text-muted-foreground py-12">{t('common.noData')}</div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {media.map((item) => (
              <div key={item.id} className="relative group">
                <img
                  src={item.url}
                  alt={getField(item.alt_text) || item.original_name}
                  className="w-full aspect-square object-cover rounded-md cursor-pointer"
                  onClick={() => {
                    setEditItem(item)
                    setEditAlt(getField(item.alt_text))
                    setEditCaption(getField(item.caption))
                  }}
                  loading="lazy"
                />
                <button
                  onClick={() => handleDelete(item)}
                  className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {item.is_cover ? (
                  <div className="absolute top-1 left-1 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Star className="w-3 h-3" fill="currentColor" /> Cover
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {total > limit && (
            <div className="flex justify-center gap-2 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} / {Math.ceil(total / limit)}
              </span>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('media.altText')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editItem && (
              <img src={editItem.url} alt="" className="w-full max-h-48 object-contain rounded-md" />
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('media.altText')} ({lang})</label>
              <Input value={editAlt} onChange={(e) => setEditAlt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('media.caption')} ({lang})</label>
              <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
