import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { ListDoctorsDto } from './dto/list-doctors.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { DoctorStatusDto } from './dto/doctor-status.dto';

/**
 * Doctor management (admin) and self-service profile (doctor) endpoints
 * (Req 4.2, 17.6, 17.7, 21.6). All require authentication; role-restricted as noted.
 */
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  list(@Query() query: ListDoctorsDto) {
    return this.doctorsService.list(query);
  }

  // Patient location-based search (Req 5). Declared before :id to avoid shadowing.
  @Roles(UserRole.PATIENT)
  @Get('search')
  search(@Query() query: SearchDoctorsDto) {
    return this.doctorsService.search(query);
  }

  // The authenticated doctor's own profile — declared before :id to avoid shadowing.
  @Roles(UserRole.DOCTOR)
  @Get('me')
  getOwnProfile(@CurrentUser('id') userId: string) {
    return this.doctorsService.getOwnProfile(userId);
  }

  @Roles(UserRole.DOCTOR)
  @Patch('me')
  updateOwnProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateDoctorProfileDto) {
    return this.doctorsService.updateOwnProfile(userId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.doctorsService.detail(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id/status')
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DoctorStatusDto) {
    return this.doctorsService.updateStatus(id, dto);
  }
}
