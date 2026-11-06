# Customer Membership Schema Review

Status: schema proposal on a feature branch; not merged and not applied to a database.

- Customer remains the sole commercial ownership root.
- Organization is an optional one-to-one company profile attached to Customer.
- CustomerMembership is the canonical User-to-Customer membership relation for individual and business accounts.
- Business membership is resolved through Customer and its optional Organization profile. No parallel OrganizationMember authorization table is introduced.
- The legacy Customer.userId field is retained temporarily for compatibility only and must not be used as an authorization path. Removal requires a reviewed backfill.

Membership statuses: INVITED (no access), ACTIVE (eligible subject to verified identity and policy), SUSPENDED (no access), REMOVED (no access; retained for history). Lifecycle timestamps are recorded. Reinstatement should reactivate the existing row through an audited transition.

Not implemented or decided: customer role catalogue and permission mapping; who may invite/suspend/remove/reinstate; invitation token generation, secure storage, delivery, expiry and acceptance verification; account switching UX; lifecycle transition enforcement; immutable audit events; scoped resource grants; authentication/session verification; trusted principal population; legacy user-link backfill.

Next validation: Prisma schema/client CI; review generated SQL preview without applying it; add lifecycle constraints after policy approval; implement audited transition services; add pending/suspended/removed and cross-customer denial tests; backfill legacy links only after conflict analysis. Keep customer business APIs closed until verified authentication and server-side ownership authorization are implemented.

No customer authentication, authorization, tenant isolation, invitation flow or production migration is claimed complete by this schema foundation.