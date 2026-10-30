# Executive Reference v2.0 — Requirement Traceability Index

The 143-page Executive Reference v2.0 remains the authoritative product, UX, data, security and operating specification. This index links its domains to implementation artifacts; it does not replace the source.

## 1. Source-derived inventories

| Source domain | Reference sections / appendices | Implementation artifact | Status |
|---|---|---|---|
| Authority and data/release rules | A, H, acceptance checklist | README, implementation baseline, release controls | Baseline recorded |
| Public website pages | B2; public page inventory | `SCREEN_AND_FLOW_CATALOG.md`, `apps/public-web` | 15 screen IDs catalogued; shell started |
| Admin screens and permissions | C; admin screen-by-screen appendices | `SCREEN_AND_FLOW_CATALOG.md`, `apps/admin` | 20 screen IDs catalogued; shell started |
| Customer portal | Portal/page map and customer journey | `SCREEN_AND_FLOW_CATALOG.md`, `apps/customer-portal` | High-level scope catalogued; detail decomposition pending |
| Pricing, cart and requests | D, D1–D4; configurator appendix | `SCREEN_AND_FLOW_CATALOG.md`, `LOGICAL_DATA_MODEL.md` | Core flow and financial invariants recorded |
| Design and UX flows | E, E1–E4; visual measurement appendices | `packages/ui`, public web | Initial tokens and shell only; measurement pending |
| API contracts | E4; API route proposal | `API_CONTRACT_INVENTORY.md` | Logical routes inventoried; schemas pending |
| Data model | F and entity/data-model appendices | `LOGICAL_DATA_MODEL.md` | New independent logical model draft |
| Security and privacy | G, G1 | Baseline, logical model, API rules | Controls recorded; threat model/tests pending |
| Repository and delivery | H1–H7 | `DELIVERY_PLAN.md`, CI and status | Greenfield delivery adopted |
| AI and automation | AI/workflow/operations appendices | ADR, logical model, delivery plan | Domain boundaries recorded; implementation pending |

## 2. Stable source screen identifiers

### Public
PUB-01 Home; PUB-02 Service listing; PUB-03 Service detail; PUB-04 Cart; PUB-05 Request details/review; PUB-06 Request confirmation; PUB-07 Request tracking; PUB-08 How we work; PUB-09 Use cases; PUB-10 Use-case detail; PUB-11 Demos; PUB-12 FAQ; PUB-13 Contact/consultation; PUB-14 Privacy/terms; PUB-15 404/general error.

### Administration
ADM-01 Sign-in; ADM-02 Home/metrics; ADM-03 Pages; ADM-04 Page/section editor; ADM-05 Identity/design; ADM-06 Categories; ADM-07 Services; ADM-08 Service options; ADM-09 Pricing rules; ADM-10 Requests; ADM-11 Request detail; ADM-12 Customers; ADM-13 Forms; ADM-14 Content; ADM-15 Languages; ADM-16 Users/roles; ADM-17 Audit log; ADM-18 Settings/integrations; ADM-19 Preview/publish; ADM-20 Reports/export.

See `SCREEN_AND_FLOW_CATALOG.md` for required content, actions and edge states.

## 3. API and data traceability

- Logical API route inventory: `docs/api/API_CONTRACT_INVENTORY.md`.
- New database logical model: `docs/data/LOGICAL_DATA_MODEL.md`.
- Workspace ownership boundaries: `docs/architecture/WORKSPACE_MAP.md`.
- Implementation phase plan: `docs/implementation/DELIVERY_PLAN.md`.
- Current verified implementation state: `docs/implementation/STATUS.md`.

## 4. Required traceability record for each requirement

Before implementation is considered complete, record:
1. Stable requirement ID and exact source section/screen/flow.
2. Actor/role and expected business outcome.
3. UI screen/component, states and interactions.
4. API endpoint and request/response/error contract.
5. Data entities, constraints and ownership path.
6. Permission and audit requirements.
7. Positive, negative, boundary and failure tests.
8. Responsive, accessibility and RTL/LTR verification where applicable.
9. Visual comparison evidence when a visual reference exists.
10. Implementation commit SHA, test results, known limitations and acceptance.

## 5. Current traceability status

- The source file is confirmed and contains 143 pages.
- The source's 15 public screen IDs and 20 administration screen IDs have been catalogued.
- Core public intake, pricing, request review and content publishing flows have been captured.
- A new logical data model and logical API inventory have been drafted.
- Detailed decomposition of all portal screens, owner dashboard modules, AI-agent workflows, finance, hosting and post-delivery product modules remains in progress.
- No feature is declared fully compliant with the executive reference solely because a UI shell or code file exists.
