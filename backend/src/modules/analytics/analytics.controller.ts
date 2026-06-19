import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/enums';

/** Admin analytics dashboard endpoint (Req 17.11). */
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  dashboard() {
    return this.analyticsService.dashboard();
  }
}
