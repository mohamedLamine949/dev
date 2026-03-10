import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — allow the Next.js web app to call the API
  app.enableCors({
    origin: [
      'http://localhost:3000', // web
      'http://localhost:3002', // admin
    ],
    credentials: true,
  });

  // Gobal prefix & validation
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 MaliLink API running on http://localhost:${port}/api`);
}
bootstrap();

