import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from "./authorization.constants.js";

type RequestPrincipal = {
  permissions?: string[];
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE_KEY, targets);

    if (isPublic === true) return true;

    const required = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      targets
    );

    // Protected endpoints must explicitly declare permissions.
    if (!required?.length) return false;

    const request = context.switchToHttp().getRequest<{ user?: RequestPrincipal }>();
    const granted = new Set(request.user?.permissions ?? []);

    return required.every((permission) => granted.has(permission));
  }
}
