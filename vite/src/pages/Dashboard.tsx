import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useI18n } from '../providers/I18nProvider'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { FolderKanban, Images, FileText, File, Plus, Upload, CheckCircle2 } from 'lucide-react'

interface DashboardData {
  stats: { projects: number; media: number; posts: number; pages: number }
  recentProjects: { id: number; title: string; slug: string; status: string; created_at: string }[]
  categoryBreakdown: { name: string; count: number }[]
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useI18n()
  const navigate = useNavigate()

  useEffect(() => {
    api.dashboard().then((res) => {
      setData(res as unknown as DashboardData)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">{t('common.loading')}</div>
  }

  const statCards = [
    { label: t('dashboard.totalProjects'), value: data?.stats.projects ?? 0, icon: FolderKanban, color: 'text-blue-600' },
    { label: t('dashboard.totalMedia'), value: data?.stats.media ?? 0, icon: Images, color: 'text-green-600' },
    { label: t('dashboard.totalPosts'), value: data?.stats.posts ?? 0, icon: FileText, color: 'text-purple-600' },
    { label: t('dashboard.totalPages'), value: data?.stats.pages ?? 0, icon: File, color: 'text-orange-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.recentProjects')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentProjects?.length ? (
              <div className="space-y-3">
                {data.recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <span className="text-sm font-medium">{project.title}</span>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                      {t(`projects.${project.status}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.categoryBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.categoryBreakdown?.length ? (
              <div className="space-y-3">
                {data.categoryBreakdown.map((cat) => (
                  <div key={cat.name} className="flex items-center justify-between">
                    <span className="text-sm">{cat.name}</span>
                    <span className="text-sm font-medium">{cat.count} projects</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/projects/new')}>
              <Plus className="w-4 h-4 mr-1" />
              {t('dashboard.newProject')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/media')}>
              <Upload className="w-4 h-4 mr-1" />
              {t('dashboard.uploadMedia')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            {t('dashboard.howToTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium">{t(`dashboard.howToStep${step}`)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(`dashboard.howToStep${step}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
