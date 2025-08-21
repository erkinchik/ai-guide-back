import { Module } from '@nestjs/common';
import { TourController } from './tour.controller';
import { TourService } from './tour.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
    imports: [OpenAIModule],
    controllers: [TourController],
    providers: [TourService],
})
export class TourModule {}
