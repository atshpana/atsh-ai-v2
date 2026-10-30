import { Controller, Get } from "@nestjs/common";
import { Public } from "./security/public.decorator.js";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok", service: "atsh-api", phase: "bootstrap" };
  }
}
