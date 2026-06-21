import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Logger } from 'winston';
import { User } from '../../entities/user.entity';
import { DoctorProfile } from '../../entities/doctor-profile.entity';
import { UserRole, UserStatus, VerificationStatus } from '../../entities/enums';
import { RegisterDoctorDto } from './dto/register-doctor.dto';
import { cityCoords } from '../../common/constants/cities';
import {
  OtpRateLimitException,
  OtpLockedException,
  ServiceUnavailableMsg91Exception,
} from './auth.exceptions';
import { OtpStore } from './stores/otp.store';
import { RefreshTokenStore } from './stores/refresh-token.store';
import { TokenService } from './token.service';

const DEFAULT_DEVICE = 'default';

// Dev-only fixed test logins: these phones always accept OTP 123456, bypassing
// generation/expiry/rate-limits so demos and QA are deterministic. Never active
// in production (guarded by isDev).
const STATIC_TEST_OTPS: Record<string, string> = {
  '9000000001': '123456', // demo doctor
  '8174058383': '123456', // demo patient
};

/** Sanitized user returned to clients (never exposes passwordHash). */
export interface PublicUser {
  id: string;
  role: UserRole;
  name: string | null;
  phone: string;
  email: string | null;
  avatarUrl: string | null;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Auth_Service — patient/doctor OTP login (Req 1, 2.6-2.8), admin credential
 * login (Req 17.2), and token rotation / logout (Req 3). In dev mode the OTP is
 * logged and returned in the response instead of being sent via MSG91.
 */
@Injectable()
export class AuthService {
  private readonly isDev: boolean;

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DoctorProfile) private readonly doctorProfiles: Repository<DoctorProfile>,
    private readonly otpStore: OtpStore,
    private readonly refreshStore: RefreshTokenStore,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.isDev = this.config.get<string>('NODE_ENV') !== 'production';
  }

  /** Requests an OTP for a phone number (Req 1.1, 1.4, 1.5, 2.6). */
  async requestOtp(phone: string): Promise<{ message: string; devOtp?: string }> {
    // Fixed test logins (dev only): always return 123456, no rate-limit/expiry.
    if (this.isDev && STATIC_TEST_OTPS[phone]) {
      const code = STATIC_TEST_OTPS[phone];
      this.logger.info(`[DEV STATIC OTP] ${phone} -> ${code}`);
      return { message: 'OTP generated (dev mode)', devOtp: code };
    }

    const decision = this.otpStore.canRequest(phone);
    if (!decision.allowed) {
      throw new OtpRateLimitException(decision.retryAfterSec ?? 60);
    }

    const code = this.generateOtp();
    this.otpStore.saveOtp(phone, code);

    if (this.isDev) {
      // Dev mode: surface the OTP instead of calling MSG91 so it can be entered.
      this.logger.info(`[DEV OTP] ${phone} -> ${code}`);
      return { message: 'OTP generated (dev mode)', devOtp: code };
    }

    try {
      await this.sendViaMsg91(phone, code);
    } catch {
      throw new ServiceUnavailableMsg91Exception();
    }
    return { message: 'OTP sent' };
  }

  /** Verifies an OTP and authenticates (creating a new patient if needed). */
  async verifyOtp(phone: string, otp: string, deviceId = DEFAULT_DEVICE): Promise<AuthResult> {
    const staticOtp = this.isDev ? STATIC_TEST_OTPS[phone] : undefined;
    if (staticOtp) {
      // Fixed test login: accept only the configured code, skip the OTP store.
      if (otp !== staticOtp) {
        throw new UnauthorizedException('OTP is incorrect');
      }
    } else {
      const result = this.otpStore.verify(phone, otp);
      switch (result.status) {
        case 'LOCKED':
          throw new OtpLockedException(result.retryAfterSec);
        case 'EXPIRED':
          throw new UnauthorizedException('OTP has expired');
        case 'INVALID':
          throw new UnauthorizedException('OTP is incorrect');
        case 'OK':
          break;
      }
    }

    let user = await this.users.findOne({ where: { phone } });
    if (!user) {
      // First-time login with a new phone creates a PATIENT (Req 1.6).
      user = this.users.create({ phone, role: UserRole.PATIENT, status: UserStatus.ACTIVE });
      user = await this.users.save(user);
    } else if (user.role === UserRole.DOCTOR && user.status !== UserStatus.ACTIVE) {
      // Doctors must be ACTIVE to log in (Req 2.6).
      throw new ForbiddenException('Doctor account is not active');
    }

    return this.buildAuthResult(user, deviceId);
  }

  /**
   * Registers a doctor (admin-only, Req 2.1-2.5). Rejects duplicate phone/email
   * and creates an ACTIVE DOCTOR user plus a doctor profile in one step.
   */
  async registerDoctor(dto: RegisterDoctorDto, documentUrl: string | null): Promise<PublicUser> {
    if (await this.users.findOne({ where: { phone: dto.phone } })) {
      throw new ConflictException('Phone number is already in use');
    }
    if (await this.users.findOne({ where: { email: dto.email } })) {
      throw new ConflictException('Email is already in use');
    }

    const user = await this.users.save(
      this.users.create({
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        role: UserRole.DOCTOR,
        status: UserStatus.ACTIVE,
      }),
    );

    await this.doctorProfiles.save(
      this.doctorProfiles.create({
        userId: user.id,
        specialization: dto.specialization ?? null,
        qualification: dto.qualification,
        degree: dto.degree,
        medicalRegNumber: dto.medicalRegNumber,
        clinicAddress: dto.address,
        city: dto.city ?? null,
        state: dto.state ?? null,
        // Fall back to the city center when explicit coordinates aren't provided,
        // so the doctor still appears in proximity search.
        latitude: dto.latitude ?? cityCoords(dto.city ?? null)?.latitude.toString() ?? null,
        longitude: dto.longitude ?? cityCoords(dto.city ?? null)?.longitude.toString() ?? null,
        documentUrl,
        verificationStatus: VerificationStatus.PENDING,
      }),
    );

    return this.toPublicUser(user);
  }

  /** Admin login with email + password (Req 17.2). */
  async adminLogin(email: string, password: string, deviceId = DEFAULT_DEVICE): Promise<AuthResult> {
    const user = await this.users.findOne({ where: { email, role: UserRole.ADMIN } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResult(user, deviceId);
  }

  /** Rotates tokens given a valid refresh token, invalidating the old one (Req 3.1, 3.2). */
  async refresh(refreshToken: string, deviceId = DEFAULT_DEVICE): Promise<AuthResult> {
    let payload;
    try {
      payload = await this.tokenService.verifyRefresh(refreshToken);
    } catch {
      // Invalid/expired token: drop any tokens for this device (Req 3.2).
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!this.refreshStore.isValid(payload.id, deviceId, refreshToken)) {
      // Token reuse or unknown token — invalidate the device's tokens (Req 3.2).
      this.refreshStore.remove(payload.id, deviceId);
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const user = await this.users.findOne({ where: { id: payload.id } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.buildAuthResult(user, deviceId);
  }

  /** Logs out a single device (Req 3.4). */
  logout(userId: string, deviceId = DEFAULT_DEVICE): void {
    this.refreshStore.remove(userId, deviceId);
  }

  /** Logs out all devices for a user (Req 3.5). */
  logoutAll(userId: string): void {
    this.refreshStore.removeAllForUser(userId);
  }

  /** Returns the current authenticated user's public profile. */
  async me(userId: string): Promise<PublicUser> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toPublicUser(user);
  }

  /** Issues tokens, stores the refresh token for the device, and shapes the result. */
  private async buildAuthResult(user: User, deviceId: string): Promise<AuthResult> {
    const tokens = await this.tokenService.issueTokens({ id: user.id, role: user.role });
    this.refreshStore.save(user.id, deviceId, tokens.refreshToken);
    return { user: this.toPublicUser(user), ...tokens };
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Placeholder for the MSG91 integration used in production (Req 1.1). */
  private async sendViaMsg91(_phone: string, _code: string): Promise<void> {
    // Real MSG91 HTTP call is wired when credentials are configured. In dev this
    // path is never taken (see requestOtp).
    throw new Error('MSG91 not configured');
  }
}
