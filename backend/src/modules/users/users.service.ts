import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { PatientDetail } from '../../entities/patient-detail.entity';
import { Gender } from '../../entities/enums';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

export interface PublicProfile {
  id: string;
  role: string;
  name: string | null;
  phone: string;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  avatarUrl: string | null;
}

/**
 * Users_Service — profile management (Req 4.1). Avatar uploads (4.3) reuse the
 * same local-storage / S3 strategy as document uploads when wired.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PatientDetail) private readonly patientDetails: Repository<PatientDetail>,
  ) {}

  async getMe(userId: string): Promise<PublicProfile> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(user);
  }

  /** Stores the uploaded avatar reference on the user (Req 4.3). */
  async setAvatar(userId: string, avatarUrl: string): Promise<PublicProfile> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.avatarUrl = avatarUrl;
    await this.users.save(user);
    return this.toPublic(user);
  }

  async updateProfile(userId: string, dto: UpdatePatientProfileDto): Promise<PublicProfile> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Track whether profile was incomplete before this update
    const wasIncomplete = !user.name || !user.dateOfBirth || !user.gender;

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.bloodGroup !== undefined) user.bloodGroup = dto.bloodGroup;
    if (dto.allergies !== undefined) user.allergies = dto.allergies;
    await this.users.save(user);

    // If the profile just became complete, auto-create a patient detail record
    const isNowComplete = !!(user.name && user.dateOfBirth && user.gender);
    if (wasIncomplete && isNowComplete) {
      await this.ensurePatientDetail(user);
    }

    return this.toPublic(user);
  }

  /**
   * Creates a PatientDetail record from the user's profile if one with the
   * same name doesn't already exist for this user.
   */
  private async ensurePatientDetail(user: User): Promise<void> {
    if (!user.name || !user.gender || !user.dateOfBirth) return;

    // Check if a patient detail with the same name already exists for this user
    const existing = await this.patientDetails.findOne({
      where: { userId: user.id, name: user.name },
    });
    if (existing) return;

    // Compute age from DOB
    const dob = new Date(user.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;

    await this.patientDetails.save(
      this.patientDetails.create({
        userId: user.id,
        name: user.name,
        age: Math.max(0, age),
        gender: user.gender as Gender,
      }),
    );
  }

  private toPublic(user: User): PublicProfile {
    return {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      allergies: user.allergies,
      avatarUrl: user.avatarUrl,
    };
  }
}
