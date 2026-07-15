import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './providers/AuthProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { I18nProvider } from './providers/I18nProvider'
import { ToastProvider } from './components/layout/Toast'
import { AuthGuard } from './components/layout/AuthGuard'
import { AdminShell } from './components/layout/AdminShell'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { ProjectsList } from './pages/ProjectsList'
import { ProjectForm } from './pages/ProjectForm'
import { MediaLibrary } from './pages/MediaLibrary'
import { Categories } from './pages/Categories'
import { Tags } from './pages/Tags'
import { PostsList } from './pages/PostsList'
import { PostForm } from './pages/PostForm'
import { PagesList } from './pages/PagesList'
import { PageForm } from './pages/PageForm'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <ToastProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <AuthGuard>
                      <AdminShell />
                    </AuthGuard>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="projects" element={<ProjectsList />} />
                  <Route path="projects/new" element={<ProjectForm />} />
                  <Route path="projects/:id" element={<ProjectForm />} />
                  <Route path="media" element={<MediaLibrary />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="tags" element={<Tags />} />
                  <Route path="posts" element={<PostsList />} />
                  <Route path="posts/new" element={<PostForm />} />
                  <Route path="posts/:id" element={<PostForm />} />
                  <Route path="pages" element={<PagesList />} />
                  <Route path="pages/new" element={<PageForm />} />
                  <Route path="pages/:id" element={<PageForm />} />
                </Route>
              </Routes>
            </ToastProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
