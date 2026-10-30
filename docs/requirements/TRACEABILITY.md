# Executive Reference v2.0 — Initial Traceability Map

This is an index into the full 143-page executive reference, not a replacement or a complete extraction. The source document remains authoritative. Every detailed requirement must be decomposed into acceptance criteria before its implementation is marked complete.

| Requirement domain | Reference location / source structure | Implementation area | Verification evidence |
|---|---|---|---|
| Authority, data safety and release rules | Section A and release controls | Governance, CI/CD, release process | Protected gates, backup/restore and release checklist |
| Public website pages | B2 and public-site page inventory | Public web app | Route/content inventory, responsive and localization tests |
| Admin screens and permissions | Section C; admin screen-by-screen appendices | Admin app and access-control module | Screen coverage, permission matrix and server-side denial tests |
| Design principles and flows | Section E; E1–E4 | Design system and application flows | Token inventory, interaction tests and screenshot comparisons |
| API contracts | E4 and API proposals in appendices | Backend modules | Contract tests and authorization tests |
| Logical data model | Section F and data-model appendices | New PostgreSQL schema | ERD, migration tests, constraints and tenant-isolation tests |
| Security and privacy | Section G | Identity, access, audit and storage | Threat-model review, security tests and audit evidence |
| Acceptance and testing | G1 and acceptance appendices | Quality engineering | Test reports tied to commit SHA |
| Repository and release phases | Section H | Engineering delivery | CI, preview/staging and rollback rehearsal |
| Owner control and dashboard | Dashboard appendices | Admin workspace and governance | Role-based UI/API acceptance |
| Design system and visual control | Design and visual-reference appendices | Tokens, components and theme editor | Measured visual comparison and interaction coverage |
| Service configurator and commercial journey | Service catalog/configurator appendices | Catalog, pricing, intake and quotes | Price recalculation, snapshot immutability and full journey tests |
| Customer portal and post-delivery product | Portal and lifecycle requirements | Customer portal and product modules | Contract-scope access tests and acceptance workflow |
| AI assistant and internal AI workforce | AI, automation and operations requirements | AI manager, agents and workflow integration | Scoped-tool tests, independent review and approval-gate tests |

## Traceability status
- Source file confirmed: ATSH_AI_المرجع_التنفيذي_الثابت_الشامل_v2_0.docx.
- Source size: 143 pages.
- Initial domain mapping recorded.
- Detailed screen-by-screen, flow-by-flow, API and entity extraction: in progress.
- No implementation is declared compliant until each detailed requirement is linked to tests and reviewed evidence.
