import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from 'winston';
import { User } from '../../entities/user.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { UserRole, UserStatus, VerificationStatus } from '../../entities/enums';

// Dev convenience credentials. Overridable via env; never used in production.
const DEFAULT_ADMIN_EMAIL = 'admin@doctor360.in';
const DEFAULT_ADMIN_PASSWORD = 'admin123';
const DEMO_DOCTOR_PHONE = '9000000001';

/**
 * Seeds a known admin and a demo doctor on startup so the admin portal login and
 * doctor OTP login can be exercised immediately. Runs only outside production.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DoctorProfile) private readonly doctors: Repository<DoctorProfile>,
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      return;
    }
    await this.seedAdmin();
    await this.seedDemoDoctor();
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
        verificationStatus: VerificationStatus.VERIFIED,
      }),
    );
    this.logger.info(`[SEED] Demo doctor ready -> phone ${DEMO_DOCTOR_PHONE} (OTP login)`);
  }
}
