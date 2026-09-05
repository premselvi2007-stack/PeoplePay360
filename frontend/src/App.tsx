import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthLayout } from './layouts/AuthLayout';
import { AppShell } from './layouts/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { EmployeesListPage } from './pages/employees/EmployeesListPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { SchedulesPage } from './pages/schedules/SchedulesPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { TimeOffPage } from './pages/time-off/TimeOffPage';
import { PayrollPage } from './pages/payroll/PayrollPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { UsersPage } from './pages/users/UsersPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Routes>
                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>

                {/* Main App Routes */}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/employees" element={<EmployeesListPage />} />
                  <Route path="/employees/:id" element={<EmployeeDetailPage />} />
                  <Route path="/contracts" element={<ContractsPage />} />
                  <Route path="/schedules" element={<SchedulesPage />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/time-off" element={<TimeOffPage />} />
                  <Route path="/payroll" element={<PayrollPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
