import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { useToast } from '../layout/Toast'
import { useI18n } from '../../providers/I18nProvider'
import { Search, Upload, X, Check } from 'lucide-react'

interface MediaItem {
  id: number
  url: string
  filename: string
  original_name: string
  mime_type: string
  width: number
  height: number
  file_size: number
  alt_text: string
  caption: string
  created_at: string
}

interface MediaSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (mediaIds: number[]) => void
  projectId: number
}

export function MediaSelectModal({ open, onClose, onSelect, projectId }: MediaSelectModalProps) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const limit = 20
  const { t, lang } = useI18n()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchMedia = useCallback(() => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: String(limit) }
    if (search) params.search = search
    api.media.list(params).then((res) => {
      setMedia(res.data as MediaItem[])
      setTotal(res.total)
      setLoading(false)
    }).catch(() => {
      toast(t('common.error'), 'error')
      setLoading(false)
    })
  }, [page, search])

  useEffect(() => { if (open) fetchMedia() }, [open, fetchMedia])

  useEffect(() => { setPage(1) }, [search])

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const handleSelect = () => {
    onSelect(Array.from(selectedIds))
    handleClose()
  }

  const handleClose = () => {
    setSelectedIds(new Set())
    setSearch('')
    setPage(1)
    onClose()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="w-[90vw] max-w-5xl h-[85vh] flex flex-col !p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{t('media.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-6 py-3 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t('media.searchMedia')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" />
            {uploading ? t('common.loading') : t('media.upload')}
          </Button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">{t('common.loading')}</div>
          ) : media.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">{t('common.noData')}</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {media.map((item) => {
                const isSelected = selectedIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`relative aspect-square rounded-md overflow-hidden border-2 cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 ${
                      isSelected ? 'border-primary ring-2 ring-primary' : 'border-muted'
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <img src={item.url} alt={item.original_name} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-[10px] text-white truncate">{item.original_name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size}${t('media.selectedCount')}`
              : `${total} medya`}
          </span>
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
            <Button onClick={handleSelect} disabled={selectedIds.size === 0}>
              {t('media.select')} {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
