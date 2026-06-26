import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { AppointmentStatus, ConsultationType, UserRole } from '../../entities/enums';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { PaymentGatewayService, RazorpayOrder } from '../payments/payment-gateway.service';
import { AgoraService, AgoraCredentials } from './agora.service';
import { ListAppointmentsDto } from './dto/list-appointments.dto';

const PAYMENT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes (Req 7.1)
const FREE_CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours (Req 7.5/7.6)

/**
 * Appointments_Service — booking with slot locking + payment window (Req 7),
 * status lifecycle, and cancellation with conditional refund (Req 7.5/7.6).
 */
@Injectable()
export class AppointmentsService {
  // In-memory auto-cancel timers for unpaid appointments (dev). A durable job
  // queue would replace this in production.
  private readonly paymentTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(AvailabilitySlot) private readonly slots: Repository<AvailabilitySlot>,
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
    private readonly gateway: PaymentGatewayService,
    private readonly agora: AgoraService,
  ) {}

  /** Books an available slot, creating a PENDING_PAYMENT appointment + order (Req 7.1-7.3, 7.7). */
  async book(patientId: string, slotId: string, patientDetailId?: string): Promise<{ appointment: Appointment; order: RazorpayOrder }> {
    const slot = await this.slots.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    // Atomically claim the slot so only one concurrent booking wins (Req 7.2).
    const claim = await this.slots.update({ id: slotId, isBooked: false }, { isBooked: true });
    if (claim.affected === 0) {
      throw new ConflictException('This slot is no longer available');
    }

    const profile = await this.profiles.findOne({ where: { id: slot.doctorId } });
    const fee = Number(profile?.consultationFee ?? 0) || 500;

    let order: RazorpayOrder;
    try {
      order = await this.gateway.createOrder(fee);
    } catch {
      // Payment init failed — release the slot and abort (Req 7.7).
      await this.slots.update({ id: slotId }, { isBooked: false });
      throw new BadRequestException('Could not initiate payment. Please try again.');
    }

    const appointment = await this.appointments.save(
      this.appointments.create({
        patientId,
        doctorId: slot.doctorId,
        slotId: slot.id,
        patientDetailId: patientDetailId ?? null,
        status: AppointmentStatus.PENDING_PAYMENT,
        consultationType: slot.consultationType,
        scheduledStart: slot.startTime,
        scheduledEnd: slot.endTime,
        razorpayOrderId: order.orderId,
      }),
    );

    this.scheduleExpiry(appointment.id, slot.id);
    return { appointment, order };
  }

  /** Lists appointments scoped to the caller's role, with admin filters (Req 17.10). */
  async list(
    user: AuthUser,
    query: ListAppointmentsDto = {},
  ): Promise<{ items: Appointment[]; total: number; page: number; pageSize: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.appointments
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'patient')
      .leftJoinAndSelect('a.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('a.slot', 'slot')
      .leftJoinAndSelect('a.patientDetail', 'patientDetail')
      .leftJoinAndSelect('a.review', 'review')
      .leftJoinAndSelect('a.prescription', 'prescription')
      .orderBy('a.scheduledStart', 'DESC');

    if (user.role === UserRole.PATIENT) {
      qb.where('a.patientId = :pid', { pid: user.id });
    } else if (user.role === UserRole.DOCTOR) {
      const profile = await this.profiles.findOne({ where: { userId: user.id } });
      qb.where('a.doctorId = :did', { did: profile?.id ?? '' });
    } else {
      // Admin: optional filters by status, doctor, and date range.
      if (query.status) qb.andWhere('a.status = :status', { status: query.status });
      if (query.doctorId) qb.andWhere('a.doctorId = :doctorId', { doctorId: query.doctorId });
      if (query.from) qb.andWhere('a.scheduledStart >= :from', { from: new Date(query.from) });
      if (query.to) qb.andWhere('a.scheduledStart <= :to', { to: new Date(query.to) });
    }

    const total = await qb.getCount();
    const items = await qb.take(pageSize).skip((page - 1) * pageSize).getMany();
    return { items, total, page, pageSize };
  }

  async getOne(id: string, user: AuthUser): Promise<Appointment> {
    const appointment = await this.appointments.findOne({
      where: { id },
      relations: { patient: true, doctor: { user: true }, slot: true },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    await this.assertParticipant(appointment, user);
    return appointment;
  }

  /** Cancels an appointment, refunding if cancelled >2h before start (Req 7.5/7.6). */
  async cancel(id: string, user: AuthUser): Promise<Appointment> {
    const appointment = await this.getOne(id, user);
    if ([AppointmentStatus.CANCELLED, AppointmentStatus.COMPLETED].includes(appointment.status)) {
      throw new ConflictException(`Cannot cancel a ${appointment.status} appointment`);
    }

    const msUntilStart = new Date(appointment.scheduledStart).getTime() - Date.now();
    const wasConfirmed = appointment.status === AppointmentStatus.CONFIRMED;
    const eligibleForRefund = wasConfirmed && msUntilStart > FREE_CANCEL_WINDOW_MS;

    appointment.status = AppointmentStatus.CANCELLED;
    if (eligibleForRefund) {
      const refund = await this.gateway.refund(appointment.razorpayPaymentId);
      appointment.refundStatus = refund.status;
    }
    await this.appointments.save(appointment);
    await this.releaseSlot(appointment.slotId);
    this.clearExpiry(appointment.id);
    return appointment;
  }

  /**
   * Starts the consultation (CONFIRMED → IN_PROGRESS) and, for VIDEO, returns an
   * Agora token for the caller (Req 9.1). Only participants may start (Req 9.6).
   */
  async start(
    id: string,
    user: AuthUser,
  ): Promise<{ appointment: Appointment; agora: AgoraCredentials | null }> {
    const appointment = await this.getOne(id, user);
    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.IN_PROGRESS
    ) {
      throw new ConflictException('Only a confirmed appointment can be started');
    }
    if (appointment.status === AppointmentStatus.CONFIRMED) {
      appointment.status = AppointmentStatus.IN_PROGRESS;
      await this.appointments.save(appointment);
    }
    const agora = this.tokenFor(appointment, user);
    return { appointment, agora };
  }

  /** Issues a refreshed Agora token while the call is active (Req 9.7). Participants only (Req 9.6). */
  async agoraToken(id: string, user: AuthUser): Promise<AgoraCredentials> {
    const appointment = await this.getOne(id, user);
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new ConflictException('Consultation is not in progress');
    }
    const token = this.tokenFor(appointment, user);
    if (!token) {
      throw new BadRequestException('This appointment is not a video consultation');
    }
    return token;
  }

  /** Ends the consultation but keeps IN_PROGRESS until prescription is added (Req 9.5). */
  async complete(id: string, user: AuthUser): Promise<Appointment> {
    const appointment = await this.getOne(id, user);
    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new ConflictException('Only an in-progress consultation can be completed');
    }
    // Status remains IN_PROGRESS; transitions to COMPLETED when prescription is added.
    return appointment;
  }

  /** Builds an Agora token for VIDEO appointments; patient uid=1, doctor uid=2. */
  private tokenFor(appointment: Appointment, user: AuthUser): AgoraCredentials | null {
    if (appointment.consultationType !== ConsultationType.VIDEO) {
      return null;
    }
    const uid = appointment.patientId === user.id ? 1 : 2;
    return this.agora.buildToken(appointment.id, uid, appointment.scheduledEnd);
  }

  /** Schedules auto-cancellation if payment isn't completed within the window (Req 7.1). */
  private scheduleExpiry(appointmentId: string, slotId: string): void {
    const timer = setTimeout(() => {
      void this.expireIfUnpaid(appointmentId, slotId);
    }, PAYMENT_WINDOW_MS);
    // Don't keep the event loop alive solely for this timer.
    timer.unref?.();
    this.paymentTimers.set(appointmentId, timer);
  }

  private clearExpiry(appointmentId: string): void {
    const timer = this.paymentTimers.get(appointmentId);
    if (timer) {
      clearTimeout(timer);
      this.paymentTimers.delete(appointmentId);
    }
  }

  private async expireIfUnpaid(appointmentId: string, slotId: string): Promise<void> {
    this.paymentTimers.delete(appointmentId);
    const appointment = await this.appointments.findOne({ where: { id: appointmentId } });
    if (appointment && appointment.status === AppointmentStatus.PENDING_PAYMENT) {
      appointment.status = AppointmentStatus.CANCELLED;
      await this.appointments.save(appointment);
      await this.releaseSlot(slotId);
    }
  }

  private async releaseSlot(slotId: string): Promise<void> {
    await this.slots.update({ id: slotId }, { isBooked: false });
  }

  /** Ensures the caller is the patient, the owning doctor, or an admin. */
  private async assertParticipant(appointment: Appointment, user: AuthUser): Promise<void> {
    if (user.role === UserRole.ADMIN || appointment.patientId === user.id) {
      return;
    }
    if (user.role === UserRole.DOCTOR) {
      const profile = await this.profiles.findOne({ where: { userId: user.id } });
      if (profile && profile.id === appointment.doctorId) {
        return;
      }
    }
    throw new ForbiddenException('You are not a participant in this appointment');
  }
}
