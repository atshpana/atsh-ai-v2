import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "./security/public.decorator.js";
import { HealthService } from "./health.service.js";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  live() {
    return { status: "ok", service: "atsh-api", phase: "bootstrap" };
  }

  @Public()
  @Get("live")
  liveness() {
    return { status: "ok", service: "atsh-api" };
  }

  @Public()
  @Get("ready")
  async readiness() {
    const database = await this.health.checkDatabase();
    if (!database) {
      throw new ServiceUnavailableException({
        status: "not_ready",
        service: "atsh-api",
        dependencies: { database: "unavailable" }
      });
    }
    return {
      status: "ready",
      service: "atsh-api",
      dependencies: { database: "ok" }
    };
  }
}
