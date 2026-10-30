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
