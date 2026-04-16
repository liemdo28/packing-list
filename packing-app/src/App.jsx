import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import TripFormPage from './pages/TripFormPage';
import TripDetailPage from './pages/TripDetailPage';
import PackModePage from './pages/PackModePage';
import SummaryPage from './pages/SummaryPage';
import TemplatesPage from './pages/TemplatesPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="templates" element={<TemplatesPage />} />

        {/* Trip CRUD */}
        <Route path="trips/new"      element={<TripFormPage />} />
        <Route path="trips/:id"      element={<TripDetailPage />} />
        <Route path="trips/:id/edit" element={<TripFormPage />} />

        {/* Trip workflow */}
        <Route path="trips/:id/pack"    element={<PackModePage />} />
        <Route path="trips/:id/summary" element={<SummaryPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
