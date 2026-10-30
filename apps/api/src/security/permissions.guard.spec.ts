import test from "node:test";
import assert from "node:assert/strict";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { PermissionsGuard } from "./permissions.guard.js";
import { PUBLIC_ROUTE_KEY, REQUIRED_PERMISSIONS_KEY } from "./authorization.constants.js";

function makeContext(user?: { permissions?: string[] }): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) })
  } as unknown as ExecutionContext;
}

function makeReflector(publicRoute: boolean, permissions?: string[]): Reflector {
  return {
    getAllAndOverride: (key: string) => {
      if (key === PUBLIC_ROUTE_KEY) return publicRoute;
      if (key === REQUIRED_PERMISSIONS_KEY) return permissions;
      return undefined;
    }
  } as unknown as Reflector;
}

test("explicit public route is allowed without a principal", () => {
  const guard = new PermissionsGuard(makeReflector(true));
  assert.equal(guard.canActivate(makeContext()), true);
});

test("unmarked route is denied by default", () => {
  const guard = new PermissionsGuard(makeReflector(false));
  assert.equal(guard.canActivate(makeContext({ permissions: ["requests.read"] })), false);
});

test("permission-protected route is denied without an authenticated principal", () => {
  const guard = new PermissionsGuard(makeReflector(false, ["requests.read"]));
  assert.equal(guard.canActivate(makeContext()), false);
});

test("permission-protected route requires every declared permission", () => {
  const guard = new PermissionsGuard(makeReflector(false, ["requests.read", "requests.assign"]));
  assert.equal(guard.canActivate(makeContext({ permissions: ["requests.read"] })), false);
  assert.equal(guard.canActivate(makeContext({ permissions: ["requests.read", "requests.assign"] })), true);
});
