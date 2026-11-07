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

## Lifecycle transition policy draft

The API now has a pure transition validator with this proposed state graph:

- INVITED → ACTIVE or REMOVED
- ACTIVE → SUSPENDED or REMOVED
- SUSPENDED → ACTIVE or REMOVED
- REMOVED → no further state

This validator checks state-machine validity only. It does not authenticate or authorize the actor, persist the change, set lifecycle timestamps, or emit an AuditEvent. Those remain requirements for the eventual transactional service. The actor permissions for invite, accept, suspend, remove and reinstate are not yet defined, so no lifecycle endpoint is exposed.


## Transactional lifecycle service draft

A framework-independent application service now coordinates each membership transition inside a unit-of-work transaction: load current membership, call an injected account-scoped authorizer, validate the state transition, update with an expected-current-status guard, and write the corresponding AuditEvent through the same transaction. A failed authorization, invalid transition, missing record, or concurrent status change prevents the audit write and update. The service intentionally does not expose HTTP routes and has no concrete Prisma adapter yet.

The injected authorizer is a critical security boundary: it must accept only a verified principal from the eventual Cognito/OIDC validation layer and enforce the still-to-be-approved customer membership permissions. The service is not production authorization until that adapter and the Prisma transaction adapter are implemented and tested end-to-end. Unit tests cover successful audited acceptance, denied actor, invalid transition, missing membership, and concurrent update failure.
