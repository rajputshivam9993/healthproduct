import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../entities/review.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { Appointment } from '../../entities/appointment.entity';
import { AppointmentStatus } from '../../entities/enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Reviews_Service — post-consultation reviews (Req 11). Enforces COMPLETED status
 * (11.3) and one review per appointment (11.2), and recalculates the doctor's
 * aggregate rating on each new review (11.4).
 */
@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
  ) {}

  async create(patientId: string, dto: CreateReviewDto): Promise<Review> {
    const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    if (appointment.patientId !== patientId) {
      throw new ForbiddenException('You can only review your own appointments');
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new UnprocessableEntityException('Appointment is not eligible for review');
    }
    if (await this.reviews.findOne({ where: { appointmentId: dto.appointmentId } })) {
      throw new ConflictException('A review already exists for this appointment');
    }

    const review = await this.reviews.save(
      this.reviews.create({
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId,
        rating: dto.rating,
        comment: dto.comment ?? null,
      }),
    );
    await this.recalculateRating(appointment.doctorId);
    return review;
  }

  /** Paginated reviews for a doctor, newest first (Req 11.5). */
  async listForDoctor(doctorId: string, query: ListReviewsDto): Promise<Paginated<Review>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [items, total] = await this.reviews.findAndCount({
      where: { doctorId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { items, total, page, pageSize };
  }

  /** Recomputes average rating (1 decimal) and total count for a doctor (Req 11.4). */
  private async recalculateRating(doctorId: string): Promise<void> {
    const stats = await this.reviews
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.doctorId = :doctorId', { doctorId })
      .getRawOne<{ avg: string | null; count: string }>();

    const avg = stats?.avg ?? null;
    const count = stats?.count ?? '0';
    const average = avg ? Math.round(parseFloat(avg) * 10) / 10 : 0;
    await this.profiles.update(
      { id: doctorId },
      { avgRating: average.toFixed(1), totalReviews: parseInt(count, 10) },
    );
  }
}
