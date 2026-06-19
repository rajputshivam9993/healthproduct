import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics-service';
import { appointmentService, type AppointmentFilters } from '@/services/appointment-service';

export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: analyticsService.dashboard });
}

export function useAdminAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['admin-appointments', filters],
    queryFn: () => appointmentService.list(filters),
  });
}
