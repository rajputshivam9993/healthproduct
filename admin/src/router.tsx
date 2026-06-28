import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/admin-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { DoctorsPage } from '@/pages/doctors';
import { DoctorRegisterPage } from '@/pages/doctor-register';
import { DoctorDetailPage } from '@/pages/doctor-detail';
import { AppointmentsPage } from '@/pages/appointments';
import { SlotsPage } from '@/pages/slots';
import { AnalyticsPage } from '@/pages/analytics';
import { NotFoundPage } from '@/pages/not-found';

// Client-side routing with protected route guards (Req 17.13). Authenticated admin
// pages render inside the AdminLayout shell.
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'doctors', element: <DoctorsPage /> },
      { path: 'doctors/new', element: <DoctorRegisterPage /> },
      { path: 'doctors/:id', element: <DoctorDetailPage /> },
      { path: 'appointments', element: <AppointmentsPage /> },
      { path: 'slots', element: <SlotsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
    ],
  },
  { path: '/404', element: <NotFoundPage /> },
  { path: '*', element: <Navigate to="/404" replace /> },
], { basename: '/admin' });
