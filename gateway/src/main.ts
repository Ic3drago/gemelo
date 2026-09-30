import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Default stays permissive for local demos, but a phone hitting the gateway
  // over the LAN sends a different Origin (an IP, not localhost), so allow the
  // operator to pin the allowed origins with CORS_ORIGINS.
  const allowed = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors(
    allowed.length > 0
      ? { origin: allowed, credentials: true }
      : { origin: true, credentials: true },
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API Gateway running on port ${port}`);
  console.log(allowed.length > 0 ? `CORS restricted to: ${allowed.join(', ')}` : 'CORS open (set CORS_ORIGINS to restrict)');
}
bootstrap();
