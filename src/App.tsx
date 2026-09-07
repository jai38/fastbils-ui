import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './features/auth/LoginView';
import { RegisterView } from './features/auth/RegisterView';
import { DashboardView } from './features/dashboard/DashboardView';
import { InvoiceListView } from './features/invoices/InvoiceListView';
import { InvoiceFormView } from './features/invoices/InvoiceFormView';
import { InvoiceDetailView } from './features/invoices/InvoiceDetailView';
import { CustomerListView } from './features/customers/CustomerListView';
import { ReportsView } from './features/reports/ReportsView';
import { ProfileView } from './features/organisation/ProfileView';

import { CreditNoteListView } from './features/creditnotes/CreditNoteListView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterView />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardView />} />
                      <Route path="/invoices" element={<InvoiceListView />} />
                      <Route path="/invoices/new" element={<InvoiceFormView />} />
                      <Route path="/invoices/:id" element={<InvoiceDetailView />} />
                      <Route path="/invoices/:id/edit" element={<InvoiceFormView />} />
                      <Route path="/credit-notes" element={<CreditNoteListView />} />
                      <Route path="/customers" element={<CustomerListView />} />
                      <Route path="/reports" element={<ReportsView />} />
                      <Route path="/settings" element={<ProfileView />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
