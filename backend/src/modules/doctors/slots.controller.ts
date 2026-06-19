import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { SlotRangeDto } from './dto/slot-range.dto';

/**
 * Availability slot endpoints (Req 6). Doctor self-service routes act on the
 * caller's own profile; admin routes target any doctor by id. Patients read
 * available slots. Route separation enforces the ownership rule (Req 6.7).
 */
@Controller()
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // ---- Doctor self-service (own profile) ----
  @Roles(UserRole.DOCTOR)
  @Post('doctors/me/slots')
  async createOwn(@CurrentUser('id') userId: string, @Body() dto: CreateSlotDto) {
    const doctorId = await this.slotsService.ownDoctorId(userId);
    return this.slotsService.create(doctorId, dto);
  }

  @Roles(UserRole.DOCTOR)
  @Get('doctors/me/slots')
  async listOwn(@CurrentUser('id') userId: string, @Query() range: SlotRangeDto) {
    const doctorId = await this.slotsService.ownDoctorId(userId);
    return this.slotsService.listInRange(doctorId, range.from, range.to, false);
  }

  @Roles(UserRole.DOCTOR)
  @Patch('doctors/me/slots/:slotId')
  async updateOwn(
    @CurrentUser('id') userId: string,
    @Param('slotId', ParseUUIDPipe) slotId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    const doctorId = await this.slotsService.ownDoctorId(userId);
    return this.slotsService.update(slotId, dto, doctorId);
  }

  @Roles(UserRole.DOCTOR)
  @Delete('doctors/me/slots/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeOwn(@CurrentUser('id') userId: string, @Param('slotId', ParseUUIDPipe) slotId: string) {
    const doctorId = await this.slotsService.ownDoctorId(userId);
    await this.slotsService.remove(slotId, doctorId);
  }

  // ---- Admin (any doctor) ----
  @Roles(UserRole.ADMIN)
  @Post('doctors/:doctorId/slots')
  createForDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string, @Body() dto: CreateSlotDto) {
    return this.slotsService.create(doctorId, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('doctors/:doctorId/slots')
  listForDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string, @Query() range: SlotRangeDto) {
    return this.slotsService.listInRange(doctorId, range.from, range.to, false);
  }

  @Roles(UserRole.ADMIN)
  @Patch('slots/:slotId')
  updateAny(@Param('slotId', ParseUUIDPipe) slotId: string, @Body() dto: UpdateSlotDto) {
    return this.slotsService.update(slotId, dto, null);
  }

  @Roles(UserRole.ADMIN)
  @Delete('slots/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAny(@Param('slotId', ParseUUIDPipe) slotId: string) {
    await this.slotsService.remove(slotId, null);
  }

  // ---- Patient: available slots for a doctor (Req 6.8) ----
  @Roles(UserRole.PATIENT)
  @Get('doctors/:doctorId/available-slots')
  available(@Param('doctorId', ParseUUIDPipe) doctorId: string, @Query() range: SlotRangeDto) {
    return this.slotsService.listInRange(doctorId, range.from, range.to, true);
  }
}
