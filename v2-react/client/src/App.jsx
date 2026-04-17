import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

import StoreListPage from './domains/user/pages/StoreListPage';
import StoreFormPage from './domains/user/pages/StoreFormPage';

import ItemListPage from './domains/inventory/pages/ItemListPage';
import ItemFormPage from './domains/inventory/pages/ItemFormPage';

import PriceListPage from './domains/inventory/pages/PriceListPage';
import PriceFormPage from './domains/inventory/pages/PriceFormPage';
import PriceHistoryPage from './domains/inventory/pages/PriceHistoryPage';

import OrderListPage from './domains/order/pages/OrderListPage';
import OrderCreatePage from './domains/order/pages/OrderCreatePage';
import OrderDetailPage from './domains/order/pages/OrderDetailPage';

import NotificationListPage from './domains/notification/pages/NotificationListPage';

import SummaryPage from './pages/summary/SummaryPage';

import InvoiceListPage from './domains/invoice/pages/InvoiceListPage';
import InvoiceFormPage from './domains/invoice/pages/InvoiceFormPage';
import InvoiceDetailPage from './domains/invoice/pages/InvoiceDetailPage';
import InvoiceReconcilePage from './domains/invoice/pages/InvoiceReconcilePage';

import AuditLogPage from './pages/audit-logs/AuditLogPage';

import UserListPage from './domains/user/pages/UserListPage';
import UserFormPage from './domains/user/pages/UserFormPage';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Stores */}
        <Route path="stores" element={<ProtectedRoute roles={['admin']}><StoreListPage /></ProtectedRoute>} />
        <Route path="stores/new" element={<ProtectedRoute roles={['admin']}><StoreFormPage /></ProtectedRoute>} />
        <Route path="stores/:id/edit" element={<ProtectedRoute roles={['admin']}><StoreFormPage /></ProtectedRoute>} />

        {/* Items */}
        <Route path="items" element={<ItemListPage />} />
        <Route path="items/new" element={<ProtectedRoute roles={['admin', 'b1', 'b2', 'b3']}><ItemFormPage /></ProtectedRoute>} />
        <Route path="items/:id/edit" element={<ProtectedRoute roles={['admin', 'b1', 'b2', 'b3']}><ItemFormPage /></ProtectedRoute>} />

        {/* Prices */}
        <Route path="prices" element={<ProtectedRoute roles={['admin', 'accountant']}><PriceListPage /></ProtectedRoute>} />
        <Route path="prices/new" element={<ProtectedRoute roles={['admin', 'accountant']}><PriceFormPage /></ProtectedRoute>} />
        <Route path="prices/history/:itemId" element={<ProtectedRoute roles={['admin', 'accountant']}><PriceHistoryPage /></ProtectedRoute>} />

        {/* Orders */}
        <Route path="orders" element={<OrderListPage />} />
        <Route path="orders/new" element={<ProtectedRoute roles={['admin', 'b1', 'b3']}><OrderCreatePage /></ProtectedRoute>} />
        <Route path="orders/:id" element={<OrderDetailPage />} />

        {/* Notifications */}
        <Route path="notifications" element={<NotificationListPage />} />

        {/* Summary */}
        <Route path="summary" element={<ProtectedRoute roles={['admin', 'accountant']}><SummaryPage /></ProtectedRoute>} />

        {/* Invoices */}
        <Route path="invoices" element={<ProtectedRoute roles={['admin', 'accountant', 'b2']}><InvoiceListPage /></ProtectedRoute>} />
        <Route path="invoices/new" element={<ProtectedRoute roles={['admin', 'accountant', 'b2']}><InvoiceFormPage /></ProtectedRoute>} />
        <Route path="invoices/:id" element={<ProtectedRoute roles={['admin', 'accountant', 'b2']}><InvoiceDetailPage /></ProtectedRoute>} />
        <Route path="invoices/:id/edit" element={<ProtectedRoute roles={['admin', 'accountant', 'b2']}><InvoiceFormPage /></ProtectedRoute>} />
        <Route path="invoices/reconcile" element={<ProtectedRoute roles={['admin', 'accountant']}><InvoiceReconcilePage /></ProtectedRoute>} />

        {/* Audit Logs */}
        <Route path="audit-logs" element={<ProtectedRoute roles={['admin', 'accountant']}><AuditLogPage /></ProtectedRoute>} />

        {/* Users */}
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UserListPage /></ProtectedRoute>} />
        <Route path="users/new" element={<ProtectedRoute roles={['admin']}><UserFormPage /></ProtectedRoute>} />
        <Route path="users/:id/edit" element={<ProtectedRoute roles={['admin']}><UserFormPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
