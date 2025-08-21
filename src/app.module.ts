import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TourModule } from './tour/tour.module';
import { OpenAIModule } from './openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OpenAIModule,
    TourModule,
  ],
})
export class AppModule {}
