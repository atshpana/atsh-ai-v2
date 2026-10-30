import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Reflector } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { PermissionsGuard } from "./security/permissions.guard.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalGuards(new PermissionsGuard(app.get(Reflector)));
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, "0.0.0.0");
}
void bootstrap();
