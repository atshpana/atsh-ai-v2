# Real build sandbox

## Runtime boundary

The worker talks to a dedicated Docker Engine API over HTTPS with mutual TLS. The daemon must be a separate, rootless Linux runtime with daemon label `atsh.sandbox=true`; the Docker Engine ID returned by its `/info` endpoint is pinned in `SANDBOX_DOCKER_EXPECTED_DAEMON_ID`. Do not point this client at the Coolify host daemon and do not mount `/var/run/docker.sock` into the worker. Docker daemon control is privileged, so the daemon host must contain no production services, databases, or credentials and must be reserved for disposable build containers.

The model command tool is added only when the complete sandbox configuration exists and the worker can verify the pinned daemon. Each command creates a fresh container from `SANDBOX_IMAGE`, which must be an immutable `sha256` image reference. Before starting the command the backend inspects the created container and refuses it unless the effective configuration still matches policy:

- UID/GID `65532:65532`, all Linux capabilities dropped, no-new-privileges, and a read-only root filesystem.
- Docker network mode `none`, disabled IPC, private PID/UTS/cgroup namespaces, no host binds, devices, published ports, or extra mounts.
- A 256 MiB workspace tmpfs and a 64 MiB `/tmp`, 1 CPU, 512 MiB memory with no extra swap, and 128 processes.
- Before start, the inspected container must retain only the trusted bootstrap entrypoint with an empty command and the exact `HostConfig.Tmpfs` paths/sizes; any materialized mount entries are checked strictly. The requested command is supplied later through Docker exec with a pinned non-root user and `Privileged=false`. The real-runtime acceptance verifies both writable paths are bounded tmpfs from inside the running container.
- Docker log persistence is disabled (`LogConfig.Type=none`). Command stdout/stderr is returned by the live Docker exec response under the request's byte limit, and the trusted workspace export uses a separate bounded response.
- A per-command deadline and abort signal, followed by force removal after result collection or on cancellation/failure.

The worker transfers only regular workspace files as a tar archive. `.env*`, `.git`, `node_modules`, and reserved internal result paths are excluded. Symlinks, special files, traversal paths, oversized archives, and unsafe archive output are rejected. To keep the root filesystem read-only, the container starts only the trusted bootstrap entrypoint, which reads the archive from stdin and extracts it into the bounded `/workspace` tmpfs before remaining idle. The worker then starts the requested argv with Docker's exec API as UID/GID `65532:65532`, with stdin detached and privilege disabled; completion status comes from Docker's exec inspection, not generated process output. Once the exec completes, a separate trusted `tar --format=ustar` exec streams the workspace through Docker's multiplexed stdout frames. The worker bounds that response, rejects stderr or malformed frames, pauses the container, validates and applies the workspace archive while tmpfs is still mounted, then removes the container. This avoids Docker's archive endpoint for user-created tmpfs mounts and prevents generated code from forging completion status. The initial attach stream closes worker stdin after staging. The mTLS proxy permits only the exact workspace-input attach route. Only a small environment allowlist (`CI`, `LANG`, `NODE_ENV`, `TZ`) can cross into the container. No database, GitHub, OpenAI, Coolify, or n8n credentials are passed to it.

## Configuration

Leave all `SANDBOX_*` settings empty until the dedicated runtime is ready. The backend is fail-closed: no settings returns `null`; partial settings, non-HTTPS endpoints, a mutable image tag, an unpinned or non-rootless daemon, an engine ID mismatch, or missing resource-limit support fail initialization or preflight. Keep the CA/client certificates in the runtime secret store and expose them as protected files; never commit them or print their contents.

Required settings:

- `SANDBOX_DOCKER_HOST`: HTTPS origin for the dedicated Docker API, with mTLS enabled.
- `SANDBOX_DOCKER_CA_FILE`, `SANDBOX_DOCKER_CERT_FILE`, `SANDBOX_DOCKER_KEY_FILE`: paths to runtime-injected mTLS files.
- `SANDBOX_DOCKER_EXPECTED_DAEMON_ID`: ID observed from that isolated daemon during reviewed provisioning.
- `SANDBOX_IMAGE`: immutable sha256 reference for the reviewed tool image. `Dockerfile.sandbox` defines the initial Node tool image and GNU `tar` bootstrap dependency; publish it through an approved non-production image registry and pin the resulting digest.
- `AGENT_WORKSPACE_ROOT`: absolute per-job workspace root.

## Verification status

Unit tests cover daemon identity checks, the generated container policy, exact effective container settings, Docker exec output-frame parsing, safe workspace archive transfer, traversal/symlink rejection, and refusal of secret environment variables. `docker-sandbox.integration.test.ts` is a real-runtime acceptance test. The `Sandbox Integration` workflow uses an ephemeral `ubuntu-24.04` GitHub runner, disables its system Docker service, and starts a separate rootless Docker user service under systemd with cgroup v2. It pins the Docker repository signing-key fingerprint, installs signed packages, and exposes the daemon only through the runner user's Unix socket; the worker reaches that socket through a local mTLS gate. Generated test certificates and the daemon are destroyed with the runner. The test verifies non-root execution, no network interface beyond loopback, no Docker socket, read-only root, actual bounded tmpfs mounts for workspace and `/tmp`, workspace and tmp writes, cgroup CPU/memory/PID values, output cap, cancellation and timeout cleanup.

The worker process on the current development host has no Docker daemon: `docker version` reported that the Windows engine named pipe is absent, and Podman is not installed. This is not proof of deployed Coolify state. The model tool remains unavailable in Coolify while these settings are empty. Do not add the runtime configuration to Coolify until the real-runtime test passes against the selected dedicated daemon and its identity/network boundary is recorded.

## Latest transport correction — 2026-11-07

The rootless run on PR head `fd23bb7be190505b3dfd376b190e5c0002d2ebe1` passed CI, CodeQL, and Dependency Review but timed out during command completion. Docker's archive endpoint cannot reliably read user-created tmpfs mounts, and generated code must not control the completion signal. The implementation now obtains process exit status through Docker exec inspection and exports the workspace with a separate trusted `tar` exec over bounded Docker stream frames. Docker log persistence is disabled. Local focused tests pass 16/16; the new exec/export sequence has not yet run against the ephemeral daemon. ENG-03 remains open until real acceptance passes.
