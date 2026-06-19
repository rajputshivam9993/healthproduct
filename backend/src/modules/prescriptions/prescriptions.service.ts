import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from '../../entities/prescription.entity';
import { Appointment } from '../../entities/appointment.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { AppointmentStatus, UserRole } from '../../entities/enums';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Prescriptions_Service — doctors create prescriptions for COMPLETED appointments
 * (Req 10.1, 10.5), one per appointment (10.6), and participants view them with
 * access control (10.2, 10.3, 10.4).
 */
@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription) private readonly prescriptions: Repository<Prescription>,
    @InjectRepository(Appointment) private readonly appointments: Repository<Appointment>,
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
  ) {}

  async create(doctorUserId: string, dto: CreatePrescriptionDto): Promise<Prescription> {
    const appointment = await this.appointments.findOne({ where: { id: dto.appointmentId } });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const profile = await this.profiles.findOne({ where: { userId: doctorUserId } });
    if (!profile || profile.id !== appointment.doctorId) {
      // Only the assigned doctor may prescribe (Req 10.2).
      throw new ForbiddenException('You are not the assigned doctor for this appointment');
    }
    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new UnprocessableEntityException('Appointment must be COMPLETED to add a prescription');
    }
    if (await this.prescriptions.findOne({ where: { appointmentId: dto.appointmentId } })) {
      throw new ConflictException('A prescription already exists for this appointment');
    }

    return this.prescriptions.save(
      this.prescriptions.create({
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        medications: dto.medications,
        notes: dto.notes ?? null,
      }),
    );
  }

  /** Patient's prescription history, newest first (Req 10.3). */
  async listForPatient(patientId: string, query: ListPrescriptionsDto): Promise<Paginated<Prescription>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const [items, total] = await this.prescriptions.findAndCount({
      where: { patientId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { items, total, page, pageSize };
  }

  /** Single prescription, accessible only to the prescribing doctor or patient (Req 10.4). */
  async getOne(id: string, user: AuthUser): Promise<Prescription> {
    const prescription = await this.prescriptions.findOne({ where: { id } });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }
    const isPatient = prescription.patientId === user.id;
    const isDoctor =
      user.role === UserRole.DOCTOR &&
      (await this.profiles.findOne({ where: { userId: user.id } }))?.id === prescription.doctorId;
    if (!isPatient && !isDoctor && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You are not allowed to view this prescription');
    }
    return prescription;
  }
}
