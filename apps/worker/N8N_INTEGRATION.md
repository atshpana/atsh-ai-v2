# n8n integration adapter (draft-only)

The worker can connect to an n8n instance through the documented public REST API. This adapter intentionally creates and updates inactive workflows only. It has no activate, deactivate, credential-create, community-package-install, or spend operation.

## Runtime configuration

- `N8N_BASE_URL`: self-hosted instance URL or Cloud URL.
- `N8N_API_KEY`: API key stored in the runtime secret manager; never commit it.
- `N8N_NODE_CATALOG_PATH`: optional path to a reviewed JSON snapshot exported from the target instance or a verified package manifest.

The n8n public API uses `X-N8N-API-KEY` and `/api/v1`. It is not available on n8n free trials. Non-Enterprise API keys have broad access, so create a dedicated key, keep it only in the worker secret store, and restrict access at the n8n project/instance boundary. Enterprise scopes should be least-privilege.

## Supported operations

- List workflows with cursor pagination.
- Read a workflow.
- Create an inactive draft (the request deliberately omits `active`).
- Update a workflow only after verifying that it is inactive.
- List executions for evidence review.
- Validate node types, exact node versions, and credential references against a dated instance-specific catalog.
- Emit sanitized audit events without request bodies, API keys, or credential values.

## Node schema and credentials

Do not guess node names, versions, parameters, or credential schemas. The adapter requires a dated catalog sourced from the target n8n instance or a verified installed-package manifest. Credential values are never accepted by the workflow definition; nodes may reference existing credential IDs only. Creating or changing credentials is intentionally outside this adapter.

## Testing and activation boundary

The public API documents workflow CRUD and execution listing, but this adapter does not assume a generic API operation can safely execute arbitrary draft workflows. Test workflows using an isolated n8n test instance or an explicitly configured test trigger, then inspect execution records. Production triggers remain inactive. Activation, credential mutation, destructive changes, paid package installation, and production deployment require an explicit approval record and a separate privileged operation, none of which this adapter exposes.

## Evidence

See the official n8n API reference and authentication guide:
- https://docs.n8n.io/connect/n8n-api/api-reference
- https://docs.n8n.io/connect/n8n-api/authentication
