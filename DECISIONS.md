# ATSH AI Software Production Line — DECISIONS

## Binding target and scope
- This repository builds the ATSH AI Software Production Line, not the customer-facing ATSH AI platform itself.
- The production line's primary mission is to receive the approved HAI master file, extract and trace its requirements, build the ATSH AI platform, discover and safely integrate with approved databases/services already on the designated server, test it, produce a preview, process revisions, and prepare a controlled release.
- After approved deployment and handover, the ATSH AI platform is the system that receives and manages customer requests. The production line remains the controlled build/release mechanism for future changes.
- The detailed target lifecycle is recorded in `docs/ENGINE-EXECUTION-BASELINE.md`.

## Existing server database boundary
- Existing server databases must be discovered and their ownership/purpose understood before integration design.
- Do not assume they are disposable, replaceable, or all owned by ATSH AI.
- `agent-db` remains the durable source of truth for engine tasks/jobs/plans/checkpoints/approvals/audit events.
- The Build Worker must not receive unrestricted production database credentials or direct network access to `core-db`.
- ATSH AI application runtime data access is separate from the build sandbox and must use approved APIs or narrowly scoped least-privilege access.
- No destructive schema/data changes or production migrations without a reviewed plan, non-production validation, recovery plan, and explicit approval.

## Governance and security
- Owner confirms Coolify, GitHub, existing server database/backup, and existing OpenAI key preparation complete; do not repeat broad readiness checks.
- Use existing OpenAI key initially; inject at runtime, task-scoped and redacted. Never store secrets in Git/chat/logs.
- Every consequential approval must be persisted and tied to the exact release/version or commit SHA.
- One active task at a time; do not redo completed tasks without concrete evidence and a new scoped task.
- No merge to `main`, production migration, or production deployment without explicit version-specific approval and required safety gates.
- A working directory, command allowlist, timeout, or environment filtering alone is not a security sandbox; generated/customer-controlled code must not execute in the worker process or on the host.

## Verified implementation facts
- Durable queue/lease/retry/event/checkpoint foundation exists in worker source.
- Tool planner persists plans but is not a general executor.
- GitHub worker integration is read-only.
- PR #27 merged: per-job workspace and guarded create-only file writes.
- PR #30 merged: `workspace_write_file` exposed in worker tool loop; PR checks all passed.
- PR #32 is a sandbox contract/policy proposal only until CI is resolved and a concrete isolation backend is implemented and tested.

## Open technical decisions
- Concrete sandbox runtime implementation is a dedicated rootless Linux Docker Engine controlled over HTTPS/mTLS; verify actual Coolify-side support, isolated-daemon identity, and network placement before activation.
- Read-only database discovery mechanism and approved inventory scope.
- Database/API integration map after HAI requirements are extracted.
- Parent/child task graph schema and dispatch concurrency.
- Restricted GitHub write credential and PR lifecycle.
- Model/provider quality/cost evidence and spend limits.

## ENG-03 sandbox backend decision — 2026-11-07
- Implement the backend against the Docker Engine API over HTTPS/mTLS, with a pinned daemon ID, the `atsh.sandbox=true` daemon label, Linux/rootless mode, and cgroup limit support. Do not use the Coolify host daemon or mount its Docker socket into the Worker.
- Run one disposable, non-root container per command from an immutable image digest. Enforce `NetworkMode=none`, disabled IPC, private PID/UTS/cgroup namespaces, read-only root, no host bind/device/port mounts, UID 65532, dropped capabilities, no-new-privileges, exactly two bounded tmpfs mounts, CPU/memory/PID/time/output limits, cancellation and cleanup. Inspect effective settings and reject deviations before start.
- The sandbox receives no credentials and no network access. Package installation that requires a registry is not enabled; ENG-09 must use an approved artifact cache or a separately reviewed allowlist policy.
- The Worker adds `sandbox_run_command` only after complete runtime configuration and daemon preflight. The ephemeral rootless integration acceptance passed on branch commit d548dbd497f6cca711b1b9b89ecab875378e3571, closing repository/runtime ENG-03 acceptance. Sandbox variables remain absent in Coolify; deployment-side GATE-01 evidence is still required before enabling the tool there.
- No paid npm package or sandbox-runtime subscription was introduced; the Docker Engine client uses Node built-ins. The integration job uses the repository's existing GitHub Actions configuration and its existing usage quota.

## Rootless CI runner compatibility — 2026-11-07
- The ephemeral GitHub Actions Ubuntu runner logged RootlessKit `fork/exec /proc/self/exe: operation not permitted`; the official Rootless Containers guidance documents this AppArmor/user-namespace failure for Ubuntu 24.04+ with RootlessKit at `/usr/local/bin/rootlesskit` (https://rootlesscontaine.rs/getting-started/common/apparmor/).
- Apply the documented executable-specific AppArmor profile only on the disposable CI runner so the real rootless-daemon acceptance test can start. Do not copy this CI workaround to Coolify or treat it as evidence that the deployment daemon is isolated. The integration test remains the acceptance gate.

## Rootless CI cgroup acceptance — 2026-11-07
- The rootless DinD test daemon started and built the image, but its logs explicitly said it was running without cgroups. Docker documents that rootless CPU, memory, and PID limits require cgroup v2 and systemd; preserve the backend's fail-closed limit checks.
- The next CI attempt uses an ephemeral `ubuntu-24.04` runner, disables the runner's system Docker service, and runs a separate rootless Docker user service under systemd. Install Docker packages from Docker's signed APT repository only after checking the pinned repository-key fingerprint. Require cgroup v2 and the systemd cgroup driver before acceptance.
- Keep the Docker API on the runner user's Unix socket and pass it to the test worker only through the local mTLS proxy. Stop the user service during cleanup; the GitHub runner remains disposable. This is test infrastructure only and is not evidence that the Coolify runtime has the needed cgroup delegation, host isolation, or network boundary.
- Local workflow YAML, all eight embedded Bash blocks, the changed JavaScript, and 14 sandbox/contract/archive tests pass. Remote CI and the actual daemon acceptance have not run yet; ENG-03 remains open.
- The first run of this setup confirmed cgroup v2/systemd and passed daemon/image/mTLS setup, but one integration test failed with a Docker Engine error whose detail was suppressed. The second run narrowed this to HTTP 400 from container creation; the opt-in sanitized detail was `invalid PID mode: private`. Docker's CLI reference says the default PID namespace is private and only `host` or `container:<id>` share it. Do not send literal `private` for PID or UTS mode; omit those fields and verify inspected values are empty. Keep production response bodies hidden; only the integration test may log a 160-character Docker message after redacting paths, IDs, digests, and secret-like assignments. Unit tests verify those redactions; 15 sandbox/contract/archive tests passed after removing the invalid PID/UTS values. The first follow-up CI caught a TypeScript shape mismatch because the spec type still required omitted PID/UTS values; the fields are now optional and a unit assertion verifies omission. The corrected CI and real-runtime acceptance are still required.
- On head `a5bafca8070665742bc05c9d965f3ffc65924e5f`, CI, CodeQL, and Dependency Review passed, while the real-rootless test failed its first command with a generic suppressed error. Retain production error suppression. For opt-in integration mode only, allow the exact static messages emitted by the sandbox's policy assertions to surface so the next acceptance run can distinguish an inspected-container mismatch from an API failure; arbitrary exception messages remain suppressed. The focused Docker sandbox unit file passes 7/7 locally. This diagnostic change does not relax any acceptance condition or enable the worker tool.
- The integration-only diagnostic on head `91c88f7a2afd00b253e5371c9bb4c138edd06cf0` identified the mount-policy check as the failure. Keep the requirement of exactly two writable tmpfs mounts at `/workspace` and `/tmp`; do not loosen it based on the current CI result. The follow-up diagnostic emits only mount count, boolean presence of each approved mount, and unapproved-entry count, never raw source paths or arbitrary daemon fields. The focused suite passes 17 tests locally; the real Docker test is skipped without a daemon. Wait for another ephemeral rootless CI run before drawing conclusions.


## Coding-agent delegation — 2026-11-07
- Owner has delegated broad authority to a coding agent to select tools/dependencies, implement the production-line engine, perform final merge and production changes, and spend from the available prepaid/API balance until exhausted.
- Do not borrow, create credit, or create recurring/renewing commitments beyond available funds. Track usage and stop before funds are exhausted if safe continuation cannot be funded.
- Owner-confirmed Coolify, GitHub, existing DB/backup and OpenAI key preparation are accepted; do not repeat broad setup audits or ask for secrets/screenshots. Validate only a concrete failure or missing safety evidence needed for the next operation.
- Repository implementation and CI may proceed immediately. Generated/customer code execution requires a proven real sandbox; production-impacting changes require least-privilege, backup, tested rollback, health checks and audit evidence.
- Detailed assignment and acceptance criteria: `docs/CODING-AGENT-HANDOFF.md`.

## ENG-03 pre-start mount inspection — 2026-11-07
- Head `e2426b05e669b4619ef26d9fde888b340a0ab84f` showed that `Mounts` is empty when Docker inspects the newly created container before start, although the exact `HostConfig.Tmpfs` settings pass validation.
- Retain strict pre-start checks for exactly `/workspace` and `/tmp`, sizes, and read-only root. Permit an empty pre-start `Mounts` list because the tmpfs mounts have not been materialized; reject every non-empty mount list that differs from policy. Verify actual tmpfs type and size from inside the running acceptance container before marking ENG-03 complete.

## ENG-03 read-only workspace staging — 2026-11-07
- Docker's archive PUT endpoint returned HTTP 400 when writing workspace data into a read-only-root container. Do not make root writable for staging.
- Start the container with a pinned trusted bootstrap only, feed the validated workspace tar through the attach stdin stream, and close stdin once. The trusted bootstrap extracts under the bounded `/workspace` tmpfs and then `exec`s the requested command argv. Keep network disabled, root read-only, and credentials absent. The mTLS proxy tunnels only this exact attach route; reject all other upgrade requests.

## ENG-03 bounded local log configuration — 2026-11-07
- Head `53216985014e3ca20bcaf8c761a8ca43a09f8e97` reached container start but Docker rejected local log config because compression defaults to enabled with `max-file=1`.
- Set `compress=false` explicitly and continue checking `max-file=1` plus the request-specific `max-size`. This preserves bounded output storage and avoids increasing the file count. Docker documents this option in its [local logging driver reference](https://docs.docker.com/engine/logging/drivers/local/).
- The next daemon run passed container start but failed with a generic error after startup. In integration mode only, report one fixed stage label for create/inspect/start/stdin/wait/logs/output; do not log raw exception strings. Production continues returning the generic suppressed failure.
- The next run reached output archive application. Allow only a curated set of static tar validation/synchronization messages in the opt-in test; do not emit arbitrary filesystem exceptions or file paths. The next integration run must still establish that the archive is parsed and applied safely.

## ENG-03 Docker archive root normalization — 2026-11-07
- The real rootless job on PR head `45aced9d0c85452d78523086c1684de128562c3f` narrowed the failure to the archive parser rejecting an invalid relative path. Accept an absolute archive name only when it is rooted at the assigned `/workspace` tmpfs; strip that exact prefix and run the normal path checks on the remainder. Reject every other absolute root, traversal segment, reserved name, link, or special file.
- This is a candidate compatibility fix, not acceptance evidence. Local focused tests pass 14/14; repeat the real Docker integration and keep ENG-03 open until it passes.
- The first normalization candidate did not change the rootless Docker failure: commit `8c6649146aaed2bd0064c2a0ff5833fd9de0f9f5` still returned `Sandbox archive contains an invalid relative path.` Add safe diagnostic categories for empty names, backslashes, and absolute paths outside `/workspace`; do not accept a broader root until the integration output identifies which case the daemon emits.
- Follow-up source review found the concrete parser bug: an exact `/workspace/` root directory matched the prefix branch before the exact-root branch and was stripped to an empty name. Handle exact root forms first; keep the assigned-root-only rule and existing traversal/type/size validation. A new tar fixture covers the root entry; local focused tests pass 14/14. Real rootless acceptance must confirm the fix.

## ENG-03 collect output before tmpfs teardown — 2026-11-07
- Rootless acceptance on `d15b1351069503c26ba021f821c41feb40df2c6a` completed the in-container checks and command but could not find `result.json` on the host after output synchronization. This is consistent with downloading `/workspace` only after Docker stops the container and unmounts its tmpfs.
- Keep the trusted bootstrap process alive after the requested command, atomically publish its exit status in a reserved workspace marker, pause the container to freeze any remaining processes, read that marker and the workspace archive while the tmpfs is still mounted, then remove the container. Do not add host mounts or relax tmpfs/resource controls. The marker is reserved, parsed only by an exact allowlist, and omitted from host synchronization. Local focused tests pass 15/15; real rootless acceptance remains required.
- Rootless run on `1190030c0ff1c4a7e910523e55b57630dace011e` timed out waiting for the marker. Fail the bootstrap if marker publication itself fails, and include only a fixed integration stage in timeout diagnostics so the next run distinguishes command completion from archive retrieval without exposing paths or output.

## ENG-03 completion status and workspace export — 2026-11-07
- Do not trust a completion marker emitted through a channel controlled by generated code; it can be forged before the command exits. Use Docker exec inspect as the authority for command completion and exit status.
- Keep the container alive with only a trusted bootstrap after input staging. Run requested argv through a Docker exec configured as UID/GID `65532:65532`, `Privileged=false`, no stdin, and the fixed `/workspace` working directory. Use a second trusted exec to stream USTAR output; cap HTTP/frame/tar sizes, reject exporter stderr or malformed framing, then pause and synchronize before cleanup.
- Disable daemon log persistence while collecting live exec output under the request limit. Keep the 256 MiB workspace tmpfs, 64 MiB `/tmp`, networkless policy, read-only root, resource limits, and no credentials unchanged. This transport is an implementation candidate until the ephemeral rootless acceptance passes.

## ENG-03 compile gate correction — 2026-11-07
- The first Docker exec transport commit was blocked by TypeScript before the real sandbox test could run: `docker-sandbox.test.ts` retained an obsolete third argument after the spec builder API changed. Remove the stale argument and require CI typecheck/build plus the rootless acceptance to pass before treating the transport as viable.


## ENG-04 immutable HAI intake decisions — 2026-11-07
- Intake is permitted only for a Markdown/TXT path and source version explicitly supplied in the queued job as input.haiSource; the model cannot choose an arbitrary source/version. Resolve the configured GitHub ref first and fetch source bytes at that immutable commit.
- Preserve exact UTF-8 bytes and SHA-256 plus GitHub blob/commit/repository/ref/path/version metadata in agent-db. Same path/version with changed bytes is a hard conflict; retries are idempotent. Extracted items and evidence proposals are append-only, with row-update/delete and table-truncate-blocking triggers.
- Use deterministic source-linked extraction for typed items and explicit open questions. Do not infer missing business decisions. Page text is byte-bounded; the original source is not returned automatically. Proposed code/test/evidence links are pinned to a repository commit and stay unverified pending independent review.
- Apply the additive migration only after manual review on the dedicated agent-db; never run it against core-db. No database migration was applied in this coding stage, and no HAI master source was ingested. PDF/Word conversion and semantic completeness/conflict review remain future work.
- At branch head `7793aff6ca1e92605312f6b9424e807a9a3e59c6`, CI run `42412899138`, CodeQL `42412899142`, and Dependency Review `42412899135` passed; API tests were 5/5 and worker tests were 51 passed with the local Docker test skipped. Rootless Sandbox Integration run `42412899164` executed 52/52, including the real Docker test. CI's Prisma baseline preview did not apply the additive HAI SQL migration. ENG-04 remains open until its migration is exercised on disposable PostgreSQL and an approved HAI source is ingested.


## ENG-04 migration acceptance decision — 2026-11-07
- CI's Prisma schema validation and baseline preview do not execute raw migration SQL. Add a dedicated PostgreSQL 16 service in GitHub Actions, constrained by the acceptance script to a loopback URL, exact disposable database name and user, and an empty database before applying migrations.
- Exercise all additive API migrations in order, seed only synthetic records, and prove each HAI intake/evidence table rejects UPDATE, DELETE, and TRUNCATE. This is isolated CI evidence only; never use the acceptance script against agent-db, core-db, or production.
- Existing repository HAI traceability documents are derived artifacts, not the approved master source. Do not mark automated intake complete or substitute a derived document; wait for the new migration workflow and a source explicitly approved for intake.

## ENG-04 migration acceptance correction — 2026-11-07
- First ephemeral PostgreSQL run `42413869727` applied the migrations and inserted synthetic rows, then the TRUNCATE assertion failed because PostgreSQL rejected a parent-table TRUNCATE on foreign-key dependencies before the append-only trigger ran.
- Updated the test to use `TRUNCATE ... CASCADE` inside a rollback-only transaction. The cascade still must be rejected by the table trigger; this changes only the disposable acceptance test, not migration policy. Rerun is pending.
