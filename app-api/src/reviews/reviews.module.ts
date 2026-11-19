import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gimnasio, Resena } from '../entities';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';

@Module({
  // Gimnasio lo usa el guard que revisa que seas el dueno.
  imports: [TypeOrmModule.forFeature([Resena, Gimnasio])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
