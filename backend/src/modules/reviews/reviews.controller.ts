import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../entities/enums';
import { CreateReviewDto } from './dto/create-review.dto';
import { ListReviewsDto } from './dto/list-reviews.dto';

/** Review endpoints (Req 11). */
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Roles(UserRole.PATIENT)
  @Post('reviews')
  create(@CurrentUser('id') patientId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(patientId, dto);
  }

  // Reviews for a doctor profile — visible to patients and doctors (Req 11.5).
  @Get('doctors/:doctorId/reviews')
  listForDoctor(@Param('doctorId', ParseUUIDPipe) doctorId: string, @Query() query: ListReviewsDto) {
    return this.reviewsService.listForDoctor(doctorId, query);
  }
}
