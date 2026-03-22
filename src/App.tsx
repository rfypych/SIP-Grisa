import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import LaporanPage from './pages/admin/LaporanPage';
import DatasetPage from './pages/admin/DatasetPage';
import SettingsPage from './pages/admin/SettingsPage';
import HolidayManagementPage from './pages/admin/HolidayManagementPage';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import LogSistemPage from './pages/admin/LogSistemPage';
import LogKehadiranPage from './pages/admin/LogKehadiranPage';
import LoginPage from './pages/auth/LoginPage';
import DocumentationPage from './pages/admin/DocumentationPage';
import KioskPage from './pages/KioskPage';
import AIRecoveryPage from './pages/admin/AIRecoveryPage';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="/login" element={<LoginPage />} />
        <Route path="/kiosk" element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'kiosk']}>
            <KioskPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
          <Route path="holidays" element={<HolidayManagementPage />} />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminManagementPage />
            </ProtectedRoute>
          } />
          <Route path="logs" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <LogSistemPage />
            </ProtectedRoute>
          } />
          <Route path="attendance-logs" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <LogKehadiranPage />
            </ProtectedRoute>
          } />
          <Route path="docs" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <DocumentationPage />
            </ProtectedRoute>
          } />
          <Route path="recovery" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
              <AIRecoveryPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
