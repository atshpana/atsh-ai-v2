import { SetMetadata } from "@nestjs/common";
import { REQUIRED_PERMISSIONS_KEY } from "./authorization.constants.js";

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
