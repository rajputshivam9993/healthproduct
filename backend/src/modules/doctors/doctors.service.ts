import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { User } from '../../entities/user.entity';
import { UserRole, UserStatus, VerificationStatus } from '../../entities/enums';
import { haversineMeters } from '../../common/utils/geo';
import { isValidSpecialization } from '../../common/constants/specializations';
import { cityCoords } from '../../common/constants/cities';
import { ListDoctorsDto } from './dto/list-doctors.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { DoctorAction, DoctorStatusDto } from './dto/doctor-status.dto';

/** Summary row for the admin doctor list (Req 17.6). */
export interface DoctorListItem {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  phone: string;
  specialization: string | null;
  status: UserStatus;
  verificationStatus: VerificationStatus;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Search result row for patient doctor search (Req 5.3). */
export interface DoctorSearchResult {
  id: string;
  name: string | null;
  specialization: string | null;
  experienceYears: number;
  consultationFee: string | null;
  rating: string;
  distanceMeters: number;
  nextAvailableSlot: string | null;
  city: string | null;
  state: string | null;
}

export interface DoctorSearchResponse extends Paginated<DoctorSearchResult> {
  suggestion?: string;
}

/**
 * Doctors_Service — doctor management for admins (list/detail/status, Req 17.6/17.7)
 * and self-service profile updates for doctors (Req 4.2, 21.6).
 */
@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(DoctorProfile) private readonly profiles: Repository<DoctorProfile>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AvailabilitySlot) private readonly slots: Repository<AvailabilitySlot>,
  ) {}

  /**
   * Location-based doctor search (Req 5). Returns verified, active doctors within
   * the radius, ordered by distance, with each doctor's next available slot in the
   * coming 7 days. Distance uses haversine here so it works on the dev SQLite DB;
   * production should use PostGIS ST_DWithin/ST_Distance on the geography column.
   */
  async search(dto: SearchDoctorsDto): Promise<DoctorSearchResponse> {
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 20;
    const radiusKm = dto.radiusKm ?? 10;

    // Unknown specialty → empty list (Req 5.2).
    if (dto.specialization && !isValidSpecialization(dto.specialization)) {
      return { items: [], total: 0, page, pageSize };
    }

    const qb = this.profiles
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.role = :role', { role: UserRole.DOCTOR })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere('profile.verificationStatus = :v', { v: VerificationStatus.VERIFIED });
    if (dto.specialization) {
      qb.andWhere('profile.specialization = :spec', { spec: dto.specialization });
    }
    const candidates = await qb.getMany();

    // Resolve each doctor's location: explicit lat/long, else the center of their
    // recognised city (so city-only registrations still appear). Keep those within
    // the radius, ordered by nearest.
    const withinRadius = candidates
      .map((p) => {
        const coords =
          p.latitude && p.longitude
            ? { latitude: Number(p.latitude), longitude: Number(p.longitude) }
            : cityCoords(p.city);
        const distanceMeters = coords
          ? haversineMeters(dto.latitude, dto.longitude, coords.latitude, coords.longitude)
          : Number.POSITIVE_INFINITY;
        return { profile: p, distanceMeters };
      })
      .filter((row) => row.distanceMeters <= radiusKm * 1000)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

    const total = withinRadius.length;
    if (total === 0) {
      return { items: [], total, page, pageSize, suggestion: 'Try increasing the search radius.' };
    }

    const pageRows = withinRadius.slice((page - 1) * pageSize, page * pageSize);
    const nextSlots = await this.nextAvailableSlots(pageRows.map((r) => r.profile.id));

    const items: DoctorSearchResult[] = pageRows.map(({ profile, distanceMeters }) => ({
      id: profile.id,
      name: profile.user.name,
      specialization: profile.specialization,
      experienceYears: profile.experienceYears,
      consultationFee: profile.consultationFee,
      rating: profile.avgRating,
      distanceMeters,
      nextAvailableSlot: nextSlots.get(profile.id) ?? null,
      city: profile.city,
      state: profile.state,
    }));

    return { items, total, page, pageSize };
  }

  /** Earliest future unbooked slot (next 7 days) per doctor id (Req 5.3). */
  private async nextAvailableSlots(doctorIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (doctorIds.length === 0) return result;

    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const slots = await this.slots.find({
      where: doctorIds.map((doctorId) => ({
        doctorId,
        isBooked: false,
        startTime: Between(now, weekAhead),
      })),
      order: { startTime: 'ASC' },
    });
    for (const slot of slots) {
      if (!result.has(slot.doctorId)) {
        result.set(slot.doctorId, new Date(slot.startTime).toISOString());
      }
    }
    return result;
  }

  /** Paginated, filterable, searchable list of doctors (Req 17.6). */
  async list(query: ListDoctorsDto): Promise<Paginated<DoctorListItem>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.profiles
      .createQueryBuilder('profile')
      .innerJoin('profile.user', 'user')
      .select([
        'profile.id AS "id"',
        'profile.userId AS "userId"',
        'user.name AS "name"',
        'user.email AS "email"',
        'user.phone AS "phone"',
        'profile.specialization AS "specialization"',
        'user.status AS "status"',
        'profile.verificationStatus AS "verificationStatus"',
      ])
      .where('user.role = :role', { role: UserRole.DOCTOR });

    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere('(LOWER(user.name) LIKE :q OR user.phone LIKE :q)', {
        q: `%${query.search.toLowerCase()}%`,
      });
    }

    const total = await qb.getCount();
    const items = await qb
      .orderBy('user.name', 'ASC')
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .getRawMany<DoctorListItem>();

    return { items, total, page, pageSize };
  }

  /** Full doctor profile incl. user fields and document (Req 17.7). */
  async detail(id: string): Promise<DoctorProfile & { user: User }> {
    const profile = await this.profiles.findOne({ where: { id }, relations: { user: true } });
    if (!profile) {
      throw new NotFoundException('Doctor not found');
    }
    return profile as DoctorProfile & { user: User };
  }

  /** Admin approve / reject / activate / deactivate (Req 17.7). */
  async updateStatus(id: string, dto: DoctorStatusDto): Promise<DoctorProfile & { user: User }> {
    const profile = await this.detail(id);
    switch (dto.action) {
      case DoctorAction.APPROVE:
        profile.verificationStatus = VerificationStatus.VERIFIED;
        break;
      case DoctorAction.REJECT:
        profile.verificationStatus = VerificationStatus.REJECTED;
        break;
      case DoctorAction.ACTIVATE:
        profile.user.status = UserStatus.ACTIVE;
        break;
      case DoctorAction.DEACTIVATE:
        profile.user.status = UserStatus.INACTIVE;
        break;
    }
    await this.users.save(profile.user);
    await this.profiles.save(profile);
    return profile;
  }

  /** Returns the authenticated doctor's own profile (Req 21.6). */
  async getOwnProfile(userId: string): Promise<DoctorProfile & { user: User }> {
    const profile = await this.profiles.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return profile as DoctorProfile & { user: User };
  }

  /** Doctor updates their own editable fields (Req 4.2). */
  async updateOwnProfile(
    userId: string,
    dto: UpdateDoctorProfileDto,
  ): Promise<DoctorProfile & { user: User }> {
    const profile = await this.getOwnProfile(userId);

    if (dto.specialization !== undefined) profile.specialization = dto.specialization;
    if (dto.experienceYears !== undefined) profile.experienceYears = dto.experienceYears;
    if (dto.consultationFee !== undefined) profile.consultationFee = dto.consultationFee.toFixed(2);
    if (dto.clinicAddress !== undefined) profile.clinicAddress = dto.clinicAddress;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.latitude !== undefined) profile.latitude = dto.latitude.toString();
    if (dto.longitude !== undefined) profile.longitude = dto.longitude.toString();

    await this.profiles.save(profile);
    return profile;
  }
}
