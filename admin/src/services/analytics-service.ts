import { apiClient } from './api/client';

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  last30DaysCount: number;
  dailyTrend: Array<{ date: string; count: number }>;
}

/** Admin dashboard analytics API (Req 17.11, 19.5). */
export const analyticsService = {
  dashboard(): Promise<DashboardStats> {
    return apiClient.get('/analytics/dashboard').then((r) => r.data);
  },
};
