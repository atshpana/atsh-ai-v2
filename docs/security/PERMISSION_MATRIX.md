# Authorization and Permission Matrix — Draft v0.1

This matrix operationalizes the approved least-privilege, server-enforced authorization model. Role names are starter templates; the owner can create/modify custom roles. Exact permission keys and resource-scope rules must be reviewed before production use.

## 1. Roles and default scope

| Role template | Default resource scope | Intended responsibility |
|---|---|---|
| Owner | Entire company and all resources | Governance, policies, high-risk approvals and full administration |
| Operations Manager | Assigned departments and operational records | Daily operations, customer/request routing, staffing and delivery coordination |
| Project Manager | Assigned projects and their customer-facing work | Plans, stages, tasks, delivery and change-request coordination |
| Developer | Assigned development tasks and authorized repositories/environments | Code implementation, testing and preview builds |
| Designer | Assigned design tasks and approved assets | UX/UI, design tokens and content assets within project scope |
| Sales | Leads, assigned customers, requests and quote preparation | Sales follow-up, requirements clarification and quote drafts |
| Support | Assigned support cases and minimum customer context | Customer assistance and issue tracking |
| Accountant | Finance records explicitly assigned | Invoices, payment reconciliation and financial reporting |
| Customer | Own account, organization, requests, contracts and contracted products | Review, communication, files, approvals and permitted product operations |
| AI Manager / Specialist Agent | Explicit tool grants and task/resource scope only | AI planning or specialist execution under human governance |
| Auditor (optional template) | Read-only approved audit/reporting scope | Independent review without write permissions |

## 2. Capability matrix

Legend: **Full** = may manage within scope; **Limited** = only explicitly assigned or draft action; **Read** = read-only; **Approve** = explicit approval capability; **—** = no default access.

| Capability | Owner | Ops | PM | Developer | Designer | Sales | Support | Accountant | Customer | AI |
|---|---|---|---|---|---|---|---|---|---|---|
| Company-wide dashboard/settings | Full | Limited | — | — | — | — | — | Limited | — | — |
| Customer records | Full | Full | Limited | — | — | Full | Limited | Limited | Own only | Task scope |
| Requests and intake | Full | Full | Limited | — | — | Full | Limited | Read | Own only | Task scope |
| Quote drafting | Full | Limited | Limited | — | — | Full | — | Read | Own only | Suggest only |
| Pricing rules/catalog | Full | Limited | — | — | — | Read | — | Read | Public only | Suggest only |
| Contracts and commercial approval | Approve | Limited | Limited | — | — | Limited | — | Read | Own acceptance | No self-approval |
| Project plans/stages/tasks | Full | Full | Full | Assigned tasks | Assigned tasks | Read | Limited | — | Customer view | Draft/execute scoped |
| Code/repository access | Full | Limited | Limited | Assigned repo | — | — | — | — | Preview access only | Scoped tool only |
| Design/content assets | Full | Limited | Limited | Read | Full | Read | — | — | Published/approved only | Scoped tool only |
| Customer support cases | Full | Full | Limited | — | — | Limited | Full | — | Own cases | Scoped assistance |
| Finance/invoices/reconciliation | Full | Limited | — | — | — | Limited | — | Full | Own statements | No write/approval |
| Hosting/domain operations | Full | Limited | Limited | Technical assigned | — | — | Limited | Read | Contracted view | No production change |
| Team/roles/permissions | Full | Limited (no owner) | — | — | — | — | — | — | — | — |
| Audit logs | Full | Limited read | Project-scope read | Own actions where allowed | Own actions where allowed | Own actions where allowed | Own actions where allowed | Finance-scope read | Own visible history | Own run scope |
| Production release approval | Approve | — | Request only | — | — | — | — | — | Approve exact release if required | Never self-approve |

This table is a safe default proposal, not an authorization to grant broad access. The owner must ratify the detailed role templates and exact permission keys.

## 3. Mandatory authorization rules

- Enforce authorization in NestJS guards and domain/application services; hiding a button is not authorization.
- Deny by default. Every endpoint and command must declare required permission and resource scope.
- Customer scope is derived from the authenticated identity and membership, never from a trusted customer ID supplied by the browser.
- Project scope requires an active project assignment or an explicit temporary grant.
- Temporary delegation has start/end times, scope, grantor, reason and revocation; it expires automatically.
- Delegation cannot exceed the grantor's authority or owner-defined role ceiling.
- A staff member cannot remove or demote the last active owner.
- Disabling a staff account requires reassignment or explicit resolution of open projects/tasks.
- Export/download permission is separate from view permission and every export is audited.
- Sensitive configuration values are never returned to the browser. Admin UI may show connection state and a masked identifier only.
- AI agents use a separate principal type and explicit tool grants. Agent grants do not inherit broad human roles.
- The agent that produced a result cannot approve that result. Sensitive actions require a distinct human approver.
- All role, permission, delegation, approval and privileged setting changes create audit events.

## 4. Permission key convention

Use stable, action-specific keys, for example:
- `customers.read`, `customers.update`
- `requests.read`, `requests.assign`, `requests.transition`
- `quotes.create_draft`, `quotes.send`, `quotes.approve`
- `pricing.read`, `pricing.rules.manage`, `pricing.activate`
- `projects.read`, `projects.plan.edit`, `projects.plan.approve`
- `tasks.assign`, `tasks.complete`, `tasks.review`
- `releases.preview`, `releases.request_production`, `releases.approve_production`
- `finance.invoices.read`, `finance.invoices.manage`, `finance.reconcile`
- `team.users.manage`, `team.roles.manage`, `team.permissions.grant`
- `audit.read`, `data.export`

Permission names are examples pending a complete API/screen mapping. Do not hardcode the examples as a final seed until the owner approves the detailed matrix.

## 5. Required security tests

- Horizontal access: customer A cannot read/update customer B's requests, files, quotes, projects or product modules by changing IDs.
- Project scope: staff assigned to project A cannot access project B without a grant.
- Delegation: expired/revoked grants stop working immediately; grantor cannot delegate a higher privilege.
- Privilege escalation: role/permission APIs reject self-grant and unauthorized elevation.
- Owner safety: last active owner cannot be disabled or stripped of required governance authority.
- Export: user with read-only permission cannot export unless separately granted.
- Agent isolation: agent cannot call ungranted tools or access unrelated customer/project data.
- Approval separation: producer agent/user cannot approve its own sensitive result where independent review is required.
- Audit: privileged mutations create immutable audit evidence with actor, target, action and timestamp.
