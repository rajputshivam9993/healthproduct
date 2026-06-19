import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Appointment } from '../../entities/appointment.entity';
import { AppointmentStatus, UserRole } from '../../entities/enums';

export interface DashboardStats {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
  last30DaysCount: number;
  dailyTrend: Array<{ date: string; count: number }>;
}

/**
 * Analytics_Service — platform metrics for the admin dashboard (Req 17.11, 19.5):
 * totals, appointments grouped by status, and a 30-day creation trend.
 */
@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
  ) {}

  async dashboard(): Promise<DashboardStats> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalDoctors, totalPatients, totalAppointments, last30DaysCount] = await Promise.all([
      this.users.count({ where: { role: UserRole.DOCTOR } }),
      this.users.count({ where: { role: UserRole.PATIENT } }),
      this.appointments.count(),
      this.appointments.count({ where: { createdAt: MoreThan(since) } }),
    ]);

    const appointmentsByStatus = await this.statusBreakdown();
    const dailyTrend = await this.dailyTrend(since);

    return {
      totalDoctors,
      totalPatients,
      totalAppointments,
      appointmentsByStatus,
      last30DaysCount,
      dailyTrend,
    };
  }

  private async statusBreakdown(): Promise<Record<string, number>> {
    const rows = await this.appointments
      .createQueryBuilder('a')
      .select('a.status', 'status')
      .addSelect('COUNT(a.id)', 'count')
      .groupBy('a.status')
      .getRawMany<{ status: AppointmentStatus; count: string }>();

    const breakdown: Record<string, number> = {};
    for (const status of Object.values(AppointmentStatus)) {
      breakdown[status] = 0;
    }
    for (const row of rows) {
      breakdown[row.status] = parseInt(row.count, 10);
    }
    return breakdown;
  }

  /** Appointments created per day over the last 30 days. */
  private async dailyTrend(since: Date): Promise<Array<{ date: string; count: number }>> {
    const rows = await this.appointments.find({
      where: { createdAt: MoreThan(since) },
      select: { id: true, createdAt: true },
    });
    const counts = new Map<string, number>();
    for (const row of rows) {
      const day = new Date(row.createdAt).toISOString().slice(0, 10);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
