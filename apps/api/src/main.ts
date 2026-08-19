import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = (process.env.CORS_ORIGIN ?? "http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim());
  app.enableCors({ origin: corsOrigin, credentials: true });

  const config = new DocumentBuilder()
    .setTitle("Journal Publisher API")
    .setDescription("Journal management, OAI Gateway, static build orchestration")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Journal Publisher API listening on :${port} (docs at /docs)`);
}

bootstrap();
