import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientDetail } from '../../entities/patient-detail.entity';
import { CreatePatientDetailDto } from './dto/create-patient-detail.dto';

/** Manages patient detail records (self or family members) for the logged-in user. */
@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(PatientDetail)
    private readonly patientDetails: Repository<PatientDetail>,
  ) {}

  /** Returns all patient detail records belonging to the authenticated user. */
  async listByUser(userId: string): Promise<PatientDetail[]> {
    return this.patientDetails.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Creates a new patient detail record for the authenticated user. */
  async create(userId: string, dto: CreatePatientDetailDto): Promise<PatientDetail> {
    const detail = this.patientDetails.create({
      userId,
      name: dto.name,
      age: dto.age,
      gender: dto.gender,
    });
    return this.patientDetails.save(detail);
  }

  /** Returns a single patient detail by id, ensuring it belongs to the user. */
  async getOne(id: string, userId: string): Promise<PatientDetail> {
    const detail = await this.patientDetails.findOne({ where: { id, userId } });
    if (!detail) {
      throw new NotFoundException('Patient detail not found');
    }
    return detail;
  }
}
