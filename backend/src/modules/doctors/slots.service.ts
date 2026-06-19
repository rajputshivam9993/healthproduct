import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

const MIN_DURATION_MS = 15 * 60 * 1000; // 15 minutes (Req 6.1)
const MAX_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours (Req 6.1)
const MAX_RANGE_DAYS = 30; // Req 6.8

/**
 * Availability slot management (Req 6): create/update/delete with duration,
 * overlap, and future-time validation, plus range queries for patients/doctors.
 */
@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(AvailabilitySlot) private readonly slots: Repository<AvailabilitySlot>,
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
  ) {}

  /** Resolves the doctor profile id owned by a doctor user (Req 6.2). */
  async ownDoctorId(userId: string): Promise<string> {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return profile.id;
  }

  async create(doctorId: string, dto: CreateSlotDto): Promise<AvailabilitySlot> {
    await this.ensureDoctorExists(doctorId);
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    this.validateWindow(start, end);
    await this.assertNoOverlap(doctorId, start, end, null);

    return this.slots.save(
      this.slots.create({
        doctorId,
        date: start.toISOString().slice(0, 10),
        startTime: start,
        endTime: end,
        consultationType: dto.consultationType,
        isBooked: false,
      }),
    );
  }

  /** Updates a slot; `ownerDoctorId` is set for doctor self-service to enforce ownership. */
  async update(
    slotId: string,
    dto: UpdateSlotDto,
    ownerDoctorId: string | null,
  ): Promise<AvailabilitySlot> {
    const slot = await this.getSlot(slotId, ownerDoctorId);
    const start = dto.startTime ? new Date(dto.startTime) : slot.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : slot.endTime;
    this.validateWindow(start, end);
    await this.assertNoOverlap(slot.doctorId, start, end, slotId);

    slot.startTime = start;
    slot.endTime = end;
    slot.date = start.toISOString().slice(0, 10);
    if (dto.consultationType) slot.consultationType = dto.consultationType;
    return this.slots.save(slot);
  }

  async remove(slotId: string, ownerDoctorId: string | null): Promise<void> {
    const slot = await this.getSlot(slotId, ownerDoctorId);
    if (slot.isBooked) {
      throw new ConflictException('Cannot delete a slot with active bookings');
    }
    await this.slots.remove(slot);
  }

  /** Lists slots in a date range (Req 6.8). `onlyAvailable` excludes booked slots. */
  async listInRange(
    doctorId: string,
    from: string,
    to: string,
    onlyAvailable: boolean,
  ): Promise<AvailabilitySlot[]> {
    const start = new Date(from);
    const end = new Date(to);
    const days = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (days < 0 || days > MAX_RANGE_DAYS) {
      throw new UnprocessableEntityException(`Date range must be between 0 and ${MAX_RANGE_DAYS} days`);
    }
    const where: Record<string, unknown> = { doctorId, startTime: Between(start, end) };
    if (onlyAvailable) where.isBooked = false;
    return this.slots.find({ where, order: { startTime: 'ASC' } });
  }

  private async getSlot(slotId: string, ownerDoctorId: string | null): Promise<AvailabilitySlot> {
    const slot = await this.slots.findOne({ where: { id: slotId } });
    if (!slot) {
      throw new NotFoundException('Slot not found');
    }
    // Doctors may only manage their own slots (Req 6.7).
    if (ownerDoctorId && slot.doctorId !== ownerDoctorId) {
      throw new NotFoundException('Slot not found');
    }
    return slot;
  }

  private validateWindow(start: Date, end: Date): void {
    const duration = end.getTime() - start.getTime();
    if (Number.isNaN(duration) || duration <= 0) {
      throw new UnprocessableEntityException('endTime must be after startTime');
    }
    if (duration < MIN_DURATION_MS || duration > MAX_DURATION_MS) {
      throw new UnprocessableEntityException('Slot duration must be between 15 minutes and 4 hours');
    }
    if (start.getTime() <= Date.now()) {
      throw new UnprocessableEntityException('Slots must be scheduled in the future');
    }
  }

  /** Rejects a slot that overlaps an existing one for the same doctor (Req 6.4). */
  private async assertNoOverlap(
    doctorId: string,
    start: Date,
    end: Date,
    excludeSlotId: string | null,
  ): Promise<void> {
    // Two windows overlap iff existing.start < newEnd AND existing.end > newStart.
    const qb = this.slots
      .createQueryBuilder('s')
      .where('s.doctorId = :doctorId', { doctorId })
      .andWhere('s.startTime < :end', { end })
      .andWhere('s.endTime > :start', { start });
    if (excludeSlotId) {
      qb.andWhere('s.id != :excludeSlotId', { excludeSlotId });
    }
    const overlapping = await qb.getOne();
    if (overlapping) {
      throw new ConflictException(
        `Slot overlaps an existing slot (${new Date(overlapping.startTime).toISOString()})`,
      );
    }
  }

  private async ensureDoctorExists(doctorId: string): Promise<void> {
    if (!(await this.profiles.findOne({ where: { id: doctorId } }))) {
      throw new NotFoundException('Doctor not found');
    }
  }
}
