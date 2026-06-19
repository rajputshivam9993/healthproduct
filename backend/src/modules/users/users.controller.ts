import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { avatarStorage } from '../../common/upload/file-storage';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';

type UploadedImage = { filename: string } | undefined;

/** User profile endpoints (Req 4.1, 4.3). */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdatePatientProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  // Avatar upload (Req 4.3): JPEG/PNG ≤ 5MB stored locally (S3 in production).
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', avatarStorage))
  uploadAvatar(@CurrentUser('id') userId: string, @UploadedFile() file: UploadedImage) {
    if (!file) {
      throw new BadRequestException('No image uploaded');
    }
    return this.usersService.setAvatar(userId, `/uploads/${file.filename}`);
  }
}
