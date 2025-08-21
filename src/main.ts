import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors('*');

  const config = new DocumentBuilder()
      .setTitle('AI Tour Guide Agent')
      .setDescription('AI-powered tour guide API using ChatGPT')
      .setVersion('1.0')
      .addTag('tours')
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('AI Tour Guide Agent running on http://localhost:3000');
  console.log('API Documentation: http://localhost:3000/api');
}

bootstrap();
