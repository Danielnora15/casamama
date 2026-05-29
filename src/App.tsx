import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import RegistroDiario from './pages/RegistroDiario'
import Historial from './pages/Historial'
import Resumen from './pages/Resumen'
import ResumenSemanal from './pages/ResumenSemanal'

function ProtectedRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#141414]">
        <div className="text-[#c9a84c] text-sm animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<RegistroDiario />} />
        <Route path="historial" element={<Historial />} />
        <Route path="semana" element={<ResumenSemanal />} />
        <Route path="resumen" element={<Resumen />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e1e', color: '#e8e8e8', border: '1px solid #2e2e2e' },
            success: { iconTheme: { primary: '#c9a84c', secondary: '#141414' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function PublicRoute() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return <Login />
}
