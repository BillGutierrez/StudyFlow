import { useEffect, useState } from 'react'
import './App.css'
import { AppDataProvider, useAppData } from './context/AppDataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import HoyPage from './pages/HoyPage'
import SemanaPage from './pages/SemanaPage'
import MesPage from './pages/MesPage'
import TodasPage from './pages/TodasPage'
import TaskDetailPage from './pages/TaskDetailPage'
import CursosPage from './pages/CursosPage'
import HorarioPage from './pages/HorarioPage'
import EtiquetasPage from './pages/EtiquetasPage'
import TimelinePage from './pages/TimelinePage'
import ChatPage from './pages/ChatPage'
import MisionesPage from './pages/MisionesPage'
import LogrosPage from './pages/LogrosPage'
import RachasPage from './pages/RachasPage'
import MascotaPage from './pages/MascotaPage'
import EstadisticasPage from './pages/EstadisticasPage'
import PerfilPage from './pages/PerfilPage'
import AjustesPage from './pages/AjustesPage'
import AdminPage from './pages/AdminPage'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import TaskFormModal from './components/TaskFormModal'
import { tareasUrgentes } from './lib/selectors'
import * as notif from './lib/notifications'

function Shell() {
  const { db } = useAppData()
  const { user, isSuperadmin } = useAuth()
  const [nav, setNav] = useState({ page: 'dashboard', taskId: null })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)

  useEffect(() => {
    if (!db || !user) return
    notif.revisarYAvisar(db, user.id)
  }, [db, user])

  function navigate(page) {
    setNav({ page, taskId: null })
  }
  function openTask(id) {
    setNav({ page: 'tarea', taskId: id })
  }

  const alertCount = tareasUrgentes(db, user.id).length

  const page = nav.page
  const commonProps = { onOpenTask: openTask, onNavigate: navigate, onNewTask: () => setNewTaskOpen(true) }

  return (
    <div className="shell">
      <Sidebar
        page={page}
        onNavigate={navigate}
        alertCount={alertCount}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
      <div className="main-col">
        <TopBar page={page} onMenuClick={() => setMobileOpen(true)} onNewTask={() => setNewTaskOpen(true)} onNavigate={navigate} />
        <div className="content">
          {page === 'dashboard' && <DashboardPage {...commonProps} />}
          {page === 'hoy' && <HoyPage onOpenTask={openTask} />}
          {page === 'semana' && <SemanaPage onOpenTask={openTask} />}
          {page === 'mes' && <MesPage onOpenTask={openTask} />}
          {page === 'todas' && <TodasPage onOpenTask={openTask} />}
          {page === 'tarea' && <TaskDetailPage taskId={nav.taskId} onBack={() => navigate('todas')} />}
          {page === 'cursos' && <CursosPage onOpenTask={openTask} />}
          {page === 'horario' && <HorarioPage />}
          {page === 'etiquetas' && <EtiquetasPage />}
          {page === 'timeline' && <TimelinePage onOpenTask={openTask} />}
          {page === 'chat' && <ChatPage />}
          {page === 'misiones' && <MisionesPage />}
          {page === 'logros' && <LogrosPage />}
          {page === 'rachas' && <RachasPage />}
          {page === 'mascota' && <MascotaPage />}
          {page === 'estadisticas' && <EstadisticasPage />}
          {page === 'perfil' && <PerfilPage />}
          {page === 'ajustes' && <AjustesPage />}
          {page === 'admin' && isSuperadmin && <AdminPage onOpenTask={openTask} />}
        </div>
        <BottomNav page={page} onNavigate={navigate} onNewTask={isSuperadmin ? () => setNewTaskOpen(true) : () => navigate('chat')} />
      </div>

      {newTaskOpen && <TaskFormModal open onClose={() => setNewTaskOpen(false)} />}
    </div>
  )
}

function Gate() {
  const { user } = useAuth()
  return user ? <Shell /> : <AuthPage />
}

export default function App() {
  return (
    <AppDataProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </AppDataProvider>
  )
}
