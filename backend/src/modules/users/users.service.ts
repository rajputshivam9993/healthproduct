import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
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
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

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
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.dateOfBirth !== undefined) user.dateOfBirth = dto.dateOfBirth;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.bloodGroup !== undefined) user.bloodGroup = dto.bloodGroup;
    if (dto.allergies !== undefined) user.allergies = dto.allergies;
    await this.users.save(user);
    return this.toPublic(user);
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
