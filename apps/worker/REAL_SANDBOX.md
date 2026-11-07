# Real build sandbox

## Runtime boundary

The worker talks to a dedicated Docker Engine API over HTTPS with mutual TLS. The daemon must be a separate, rootless Linux runtime with daemon label `atsh.sandbox=true`; its 64-character engine ID is pinned in `SANDBOX_DOCKER_EXPECTED_DAEMON_ID`. Do not point this client at the Coolify host daemon and do not mount `/var/run/docker.sock` into the worker. Docker daemon control is privileged, so the daemon host must contain no production services, databases, or credentials and must be reserved for disposable build containers.

The model command tool is added only when the complete sandbox configuration exists and the worker can verify the pinned daemon. Each command creates a fresh container from `SANDBOX_IMAGE`, which must be an immutable `sha256` image reference. Before starting the command the backend inspects the created container and refuses it unless the effective configuration still matches policy:

- UID/GID `65532:65532`, all Linux capabilities dropped, no-new-privileges, and a read-only root filesystem.
- Docker network mode `none`, disabled IPC, private PID/UTS/cgroup namespaces, no host binds, devices, published ports, or extra mounts.
- A 256 MiB workspace tmpfs and a 64 MiB `/tmp`, 1 CPU, 512 MiB memory with no extra swap, and 128 processes.
- The inspected container must retain the requested command and exactly those two writable tmpfs mounts; extra capabilities, namespaces, devices, or writable paths fail before start.
- Local container logs capped to one rotated file; returned stdout/stderr is truncated to the request's byte limit.
- A per-command deadline and abort signal, followed by force removal after result collection or on cancellation/failure.

The worker transfers only regular workspace files as a tar archive. `.env*`, `.git`, and `node_modules` are excluded. Symlinks, special files, traversal paths, oversized archives, and unsafe archive output are rejected. Only a small environment allowlist (`CI`, `LANG`, `NODE_ENV`, `TZ`) can cross into the container. No database, GitHub, OpenAI, Coolify, or n8n credentials are passed to it.

## Configuration

Leave all `SANDBOX_*` settings empty until the dedicated runtime is ready. The backend is fail-closed: no settings returns `null`; partial settings, non-HTTPS endpoints, a mutable image tag, an unpinned or non-rootless daemon, an engine ID mismatch, or missing resource-limit support fail initialization or preflight. Keep the CA/client certificates in the runtime secret store and expose them as protected files; never commit them or print their contents.

Required settings:

- `SANDBOX_DOCKER_HOST`: HTTPS origin for the dedicated Docker API, with mTLS enabled.
- `SANDBOX_DOCKER_CA_FILE`, `SANDBOX_DOCKER_CERT_FILE`, `SANDBOX_DOCKER_KEY_FILE`: paths to runtime-injected mTLS files.
- `SANDBOX_DOCKER_EXPECTED_DAEMON_ID`: ID observed from that isolated daemon during reviewed provisioning.
- `SANDBOX_IMAGE`: immutable sha256 reference for the reviewed tool image. `Dockerfile.sandbox` defines the initial Node tool image; publish it through an approved non-production image registry and pin the resulting digest.
- `AGENT_WORKSPACE_ROOT`: absolute per-job workspace root.

## Verification status

Unit tests cover daemon identity checks, the generated container policy, exact effective container settings, safe workspace archive transfer, traversal/symlink rejection, and refusal of secret environment variables. `docker-sandbox.integration.test.ts` is a real-runtime acceptance test. The `Sandbox Integration` workflow starts a disposable rootless Docker daemon on an ephemeral GitHub runner and enables the test. The daemon is reached through a local mTLS gate; generated test certificates and the daemon are destroyed with the runner. It verifies non-root execution, no network interface beyond loopback, no Docker socket, read-only root, workspace and tmp writes, cgroup CPU/memory/PID values, output cap, cancellation and timeout cleanup.

The worker process on the current development host has no Docker daemon: `docker version` reported that the Windows engine named pipe is absent, and Podman is not installed. This is not proof of deployed Coolify state. The model tool remains unavailable in Coolify while these settings are empty. Do not add the runtime configuration to Coolify until the real-runtime test passes against the selected dedicated daemon and its identity/network boundary is recorded.
