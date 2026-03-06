import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from "@/components/ui/sonner"

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Cards from './pages/Cards';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import PreTransactions from './pages/PreTransactions';
import Calendar from './pages/Calendar';
import Budgets from './pages/Budgets';
import Users from './pages/Users';
import Notes from './pages/Notes';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import ReportsTrends from './pages/reports/Trends';
import TopEstablishments from './pages/TopEstablishments';
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Tenants from './pages/admin/Tenants';
import TenantUsers from './pages/admin/TenantUsers';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/pre-transactions" element={<PreTransactions />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/users" element={<Users />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/reports/trends" element={<ReportsTrends />} />
                <Route path="/top-establishments" element={<TopEstablishments />} />
                <Route path="/settings" element={<Settings />} />

                {/* Admin Routes */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<Tenants />} />
                  <Route path="/admin/tenants/:tenantId/users" element={<TenantUsers />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
