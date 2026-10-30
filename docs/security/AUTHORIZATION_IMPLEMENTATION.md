# Authorization Guard Implementation Status

## Implemented
- Global NestJS PermissionsGuard is registered at API bootstrap.
- Routes are denied by default unless explicitly marked public or declare required permissions.
- Public routes must use the Public decorator.
- Protected routes must use RequirePermissions with explicit permission keys.
- The guard checks every required permission against the authenticated request principal.
- The health endpoint is explicitly marked public.
- Unit tests cover public access, default denial, missing principal and all-permissions-required behavior.

## Not implemented yet
- Authentication provider, login, passwordless/MFA flows or session management.
- Middleware/guard that validates the session/token and populates request.user.
- Database-backed role/permission resolution and project/customer scope evaluation.
- Ownership and tenant isolation policies for domain services.
- Audit-event persistence for permission changes and privileged operations.

## Safety behavior
Until authentication and principal population are implemented, all routes other than explicitly public endpoints remain inaccessible through the global permission guard. Do not add business endpoints as public to work around missing authentication.
