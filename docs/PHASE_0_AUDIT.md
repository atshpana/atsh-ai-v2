> **Governance correction — 2026-11-07:** This file is a historical record of an earlier greenfield assumption and is not an execution authority. Its statements excluding inspection/connection of the existing ATSH database and claiming an owner-approved reset conflict with the approved fixed executive reference v2.0, HAI master, and production-line architecture v1.1. Do not use those statements to discard, replace, recreate, or ignore existing ATSH data or services. The governing requirement is to inspect the current environment read-only, preserve existing structures until their role is understood, and prepare a reviewed safe integration plan. No database action is authorized by this notice. See `docs/HAI-APPLICATION-CONFORMANCE-AUDIT.md`.

---

# Phase 0 — Greenfield Foundation

## Purpose
Prepare a clean implementation from the approved Executive Reference v2.0. The legacy application and legacy database are explicitly excluded by the owner's reset decision.

## Binding scope
- No code reuse from the legacy system.
- No legacy database inspection, connection, schema import, data migration or compatibility work.
- No production resource changes.
- The new application database is designed from the requirements and provisioned independently after the architecture and security baseline are established.

## Foundation work
- [x] Confirm the authoritative Executive Reference v2.0 is available.
- [x] Confirm the implementation repository and isolated branch.
- [x] Record the owner's greenfield reset decision.
- [x] Record approved language boundaries.
- [ ] Extract a traceable requirement inventory from the reference.
- [ ] Establish architecture decision records and module boundaries.
- [ ] Establish the design-token and component foundations from the approved visual references.
- [ ] Define the new logical data model and authorization matrix.
- [ ] Define development, test and staging environments.
- [ ] Establish CI checks and test strategy before feature delivery.

## Exit criteria
Phase 0 ends when requirements are traceable, the architecture and security boundaries are documented, the core data model is reviewed, and the first vertical slice can be implemented without depending on any legacy system.
