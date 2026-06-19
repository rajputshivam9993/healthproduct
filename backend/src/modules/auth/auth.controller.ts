import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { medicalDocumentStorage } from '../../common/upload/file-storage';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RegisterDoctorDto } from './dto/register-doctor.dto';

type UploadedDocument = { filename: string } | undefined;

/**
 * Auth endpoints (Req 1, 2, 3, 17.2). OTP/admin-login/refresh are public; me and
 * logout require a valid access token (enforced by the global JwtAuthGuard).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp, dto.deviceId);
  }

  // Admin-only doctor registration with optional medical-document upload (Req 2, 17.5).
  @Roles(UserRole.ADMIN)
  @Post('doctors')
  @UseInterceptors(FileInterceptor('document', medicalDocumentStorage))
  registerDoctor(@Body() dto: RegisterDoctorDto, @UploadedFile() file: UploadedDocument) {
    const documentUrl = file ? `/uploads/${file.filename}` : null;
    return this.authService.registerDoctor(dto, documentUrl);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken, dto.deviceId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string, @Body() dto: RefreshDto) {
    this.authService.logout(userId, dto.deviceId);
    return { message: 'Logged out' };
  }

  @Post('logout/all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser('id') userId: string) {
    this.authService.logoutAll(userId);
    return { message: 'Logged out from all devices' };
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.authService.me(userId);
  }
}
