import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './components/auth/protected-route';
import { DashboardLayout } from './components/layout/dashboard-layout';
import { DashboardPage } from './pages/dashboard-page';
import { HomeSectionsPage } from './pages/home-sections-page';
import { LoginPage } from './pages/login-page';
import { ResourceScreenPage } from './pages/resource-screen-page';
import { SiteSettingsPage } from './pages/site-settings-page';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/site-settings" element={<SiteSettingsPage />} />
          <Route path="/home-sections" element={<HomeSectionsPage />} />
          <Route path="/:resourceKey" element={<ResourceScreenPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
