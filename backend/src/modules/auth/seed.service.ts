import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from 'winston';
import { User } from '../../entities/user.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { Specialization } from '../../entities/specialization.entity';
import { UserRole, UserStatus, VerificationStatus } from '../../entities/enums';

// Dev convenience credentials. Overridable via env; never used in production.
const DEFAULT_ADMIN_EMAIL = 'admin@doctor360.in';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEMO_DOCTOR_PHONE = '9000000001';

const SEED_SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Orthopedic',
  'Neurologist',
  'Psychiatrist',
  'Dentist',
  'ENT Specialist',
  'Ophthalmologist',
  'Gastroenterologist',
  'Urologist',
  'Endocrinologist',
  'Pulmonologist',
];

/**
 * Seeds a known admin and a demo doctor on startup so the admin portal login and
 * doctor OTP login can be exercised immediately. Runs only outside production.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    @InjectRepository(Specialization) private readonly specializations: Repository<Specialization>,
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      return;
    }
    await this.seedSpecializations();
    await this.seedAdmin();
    await this.seedDemoDoctor();
  }

  private async seedSpecializations(): Promise<void> {
    // Skip if the table doesn't exist yet (migration not run).
    try {
      const count = await this.specializations.count();
      if (count > 0) return;
    } catch {
      this.logger.info('[SEED] Specializations table not found — run migrations first');
      return;
    }

    for (let i = 0; i < SEED_SPECIALIZATIONS.length; i++) {
      await this.specializations.save(
        this.specializations.create({
          name: SEED_SPECIALIZATIONS[i],
          displayOrder: i + 1,
          isActive: true,
        }),
      );
    }
    this.logger.info(`[SEED] ${SEED_SPECIALIZATIONS.length} specializations seeded`);
  }

  private async seedAdmin(): Promise<void> {
    const email = this.config.get<string>('SEED_ADMIN_EMAIL') ?? DEFAULT_ADMIN_EMAIL;
    const password = this.config.get<string>('SEED_ADMIN_PASSWORD') ?? DEFAULT_ADMIN_PASSWORD;

    const existing = await this.users.findOne({ where: { email, role: UserRole.ADMIN } });
    if (existing) {
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await this.users.save(
      this.users.create({
        email,
        phone: '9999999999',
        name: 'Platform Admin',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      }),
    );
    this.logger.info(`[SEED] Admin ready -> ${email} / ${password}`);
  }

  private async seedDemoDoctor(): Promise<void> {
    const existing = await this.users.findOne({ where: { phone: DEMO_DOCTOR_PHONE } });
    if (existing) {
      // Patch location if missing from an earlier seed run.
      const profile = await this.doctors.findOne({ where: { userId: existing.id } });
      if (profile && !profile.latitude) {
        profile.city = 'Bengaluru';
        profile.state = 'Karnataka';
        profile.latitude = '12.9716';
        profile.longitude = '77.5946';
        await this.doctors.save(profile);
        this.logger.info('[SEED] Patched demo doctor with location data');
      }
      await this.seedExtraDoctors();
      return;
    }
    const user = await this.users.save(
      this.users.create({
        phone: DEMO_DOCTOR_PHONE,
        email: 'dr.demo@doctor360.in',
        name: 'Dr. Demo',
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      }),
    );
    await this.doctors.save(
      this.doctors.create({
        userId: user.id,
        specialization: 'General Physician',
        experienceYears: 8,
        consultationFee: '500.00',
        qualification: 'MBBS, MD',
        degree: 'MD (Medicine)',
        medicalRegNumber: 'DEMO-12345',
        city: 'Bengaluru',
        state: 'Karnataka',
        latitude: '12.9716',
        longitude: '77.5946',
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );
    this.logger.info(`[SEED] Demo doctor ready -> phone ${DEMO_DOCTOR_PHONE} (OTP login)`);

    // Seed additional demo doctors so the patient search has results across cities.
    await this.seedExtraDoctors();
  }

  private async seedExtraDoctors(): Promise<void> {
    const extras = [
      { phone: '9000000002', name: 'Dr. Priya Sharma', email: 'priya@doctor360.in', spec: 'Cardiologist', city: 'Bengaluru', state: 'Karnataka', lat: '12.9352', lng: '77.6245', exp: 12, fee: '800.00', reg: 'KA-CARD-201' },
      { phone: '9000000003', name: 'Dr. Arjun Patel', email: 'arjun@doctor360.in', spec: 'Dermatologist', city: 'Mumbai', state: 'Maharashtra', lat: '19.0760', lng: '72.8777', exp: 6, fee: '600.00', reg: 'MH-DERM-302' },
      { phone: '9000000004', name: 'Dr. Sneha Reddy', email: 'sneha@doctor360.in', spec: 'Pediatrician', city: 'Hyderabad', state: 'Telangana', lat: '17.3850', lng: '78.4867', exp: 10, fee: '450.00', reg: 'TS-PED-103' },
      { phone: '9000000005', name: 'Dr. Rahul Gupta', email: 'rahul@doctor360.in', spec: 'Orthopedic', city: 'Delhi', state: 'Delhi', lat: '28.6139', lng: '77.2090', exp: 15, fee: '900.00', reg: 'DL-ORTH-404' },
      { phone: '9000000006', name: 'Dr. Meera Iyer', email: 'meera@doctor360.in', spec: 'Neurologist', city: 'Chennai', state: 'Tamil Nadu', lat: '13.0827', lng: '80.2707', exp: 9, fee: '750.00', reg: 'TN-NEU-505' },
      { phone: '9000000007', name: 'Dr. Anil Kumar', email: 'anil@doctor360.in', spec: 'General Physician', city: 'Bengaluru', state: 'Karnataka', lat: '12.9600', lng: '77.5800', exp: 5, fee: '400.00', reg: 'KA-GP-606' },
      { phone: '9000000008', name: 'Dr. Kavita Nair', email: 'kavita@doctor360.in', spec: 'Gynecologist', city: 'Pune', state: 'Maharashtra', lat: '18.5204', lng: '73.8567', exp: 11, fee: '700.00', reg: 'MH-GYN-707' },
    ];

    for (const doc of extras) {
      const exists = await this.users.findOne({ where: { phone: doc.phone } });
      if (exists) continue;

      const user = await this.users.save(
        this.users.create({
          phone: doc.phone,
          email: doc.email,
          name: doc.name,
          role: UserRole.DOCTOR,
          status: UserStatus.ACTIVE,
        }),
      );
      await this.doctors.save(
        this.doctors.create({
          userId: user.id,
          specialization: doc.spec,
          experienceYears: doc.exp,
          consultationFee: doc.fee,
          qualification: 'MBBS',
          degree: 'MD',
          medicalRegNumber: doc.reg,
          city: doc.city,
          state: doc.state,
          latitude: doc.lat,
          longitude: doc.lng,
          verificationStatus: VerificationStatus.VERIFIED,
        }),
      );
    }
    this.logger.info('[SEED] Extra demo doctors seeded');
  }
}
