/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import LaporanPage from './pages/admin/LaporanPage';
import DatasetPage from './pages/admin/DatasetPage';
import SettingsPage from './pages/admin/SettingsPage';
import KioskPage from './pages/KioskPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        
        <Route path="/kiosk" element={<KioskPage />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="laporan" element={<LaporanPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="pengaturan" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
