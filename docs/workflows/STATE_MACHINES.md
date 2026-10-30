# Workflow State Machines and Protected Gates — Draft v0.1

This document separates owner-approved lifecycle rules from proposed implementation enums. A proposed state is not a final business decision until it is reviewed and approved.

## 1. Service request lifecycle

The reference requires a request to be submitted, reviewed, clarified when needed, quoted, accepted and converted into a project through controlled transitions. The following status names align with the initial Prisma enum:

- SUBMITTED
- UNDER_REVIEW
- NEEDS_INFORMATION
- QUOTE_PREPARED
- QUOTE_SENT
- ACCEPTED
- REJECTED
- CONVERTED
- CANCELLED

### Transition rules
- New request is created as SUBMITTED only after the server commits the request and immutable price snapshot.
- SUBMITTED → UNDER_REVIEW requires authorized staff assignment/review.
- UNDER_REVIEW → NEEDS_INFORMATION when required details are missing; record exactly what is requested.
- NEEDS_INFORMATION → UNDER_REVIEW after customer response is received and validated.
- UNDER_REVIEW → QUOTE_PREPARED when scope and estimate are ready.
- QUOTE_PREPARED → QUOTE_SENT only after an authorized sender creates and sends a new immutable quote version.
- QUOTE_SENT → ACCEPTED only after explicit acceptance of that exact quote version.
- QUOTE_SENT → REJECTED or CANCELLED only through a permitted transition with reason/evidence.
- ACCEPTED → CONVERTED only after the contract/payment gates required by the approved commercial policy pass and a project is created.
- Never overwrite the original request snapshot or a prior quote version.

The state machine must reject every transition not explicitly declared. Each transition creates a RequestEvent and audit event.

## 2. Quote lifecycle

The initial quote statuses are:
- DRAFT
- SENT
- ACCEPTED
- DECLINED
- EXPIRED
- SUPERSEDED

Rules:
- A quote is mutable only while DRAFT.
- Sending freezes that quote version.
- Any revision creates a new version and marks the earlier version SUPERSEDED only according to an explicit versioning rule; history remains readable.
- Acceptance binds to quote ID + version + actor + timestamp + evidence.
- Expired/declined quotes cannot be accepted.
- A request with custom pricing must not be represented as a zero-value quote. Final total remains unset until approved pricing is fixed.

## 3. Project plan lifecycle — owner-approved status vocabulary

The owner-approved plan statuses are:
- GENERATING
- DRAFT
- PENDING_APPROVAL
- APPROVED
- ACTIVE
- NEEDS_REVISION
- CHANGE_PENDING
- SUPERSEDED
- ARCHIVED

### Protected transition principles
- AI generation produces a DRAFT plan; generation completion is not approval.
- DRAFT → PENDING_APPROVAL when a human submits the plan for review.
- PENDING_APPROVAL → APPROVED or NEEDS_REVISION by an authorized human approver.
- APPROVED → ACTIVE only when the required project lifecycle gates permit execution.
- An active plan change that materially affects scope, stages, dependencies, owners or dates enters CHANGE_PENDING and creates a new plan version/change record.
- The approved prior version remains available for audit; do not mutate it in place.
- Major changes require approval before affected work is executed.
- Template updates never rewrite existing project plan copies.
- AI manager may propose a plan but cannot approve it or exceed the tools/permissions of assigned agents.

## 4. Protected project lifecycle gates

The following gates cannot be skipped by changing a status label or reordering configurable stages:
1. Contract/scope acceptance where required.
2. Payment/financial gate where required by the approved contract.
3. Approved project plan before execution begins.
4. Required internal review and quality evidence before customer review.
5. Customer approval of the exact final artifact/version.
6. Explicit production release approval for the named build/commit and target.
7. Post-deployment verification and handover acceptance.

Operational stages between protected gates may be customized by the owner or authorized project manager. A staff member may be assigned to monitor a request before payment without starting the execution workflow.

## 5. Task lifecycle — proposed implementation states

Proposed states for review:
- BACKLOG
- READY
- IN_PROGRESS
- BLOCKED
- IN_REVIEW
- DONE
- CANCELLED

Rules:
- Every task has one accountable owner and optional collaborators.
- Completion requires defined evidence where the task type needs it.
- Agent completion is not accepted until independent review passes.
- Blocked tasks record reason, blocker owner and next review point.
- Dependencies must be acyclic and validated server-side.
- Reassignment and due-date changes are audited.

## 6. Scope change vs defect/nonconformance

These are separate paths:
- **Defect/nonconformance:** delivered work does not meet the accepted specification. It is corrected under the original scope and does not consume a customer change-request round.
- **Change request:** customer asks for work outside the accepted scope. It receives impact analysis, cost/time estimate and explicit customer approval before implementation.

Proposed ChangeRequest statuses:
DRAFT → SUBMITTED → ASSESSING → QUOTED → AWAITING_CUSTOMER_APPROVAL → APPROVED or REJECTED → IMPLEMENTING → DONE.

The owner-approved delivery rule remains: two revision rounds are available; the third review is final acceptance, not an unlimited revision cycle. Record each review round and the artifact/version it concerns.

## 7. Release lifecycle — proposed implementation states

Proposed states:
DRAFT → PREVIEW_BUILD → QA_REVIEW → CUSTOMER_REVIEW → AWAITING_RELEASE_APPROVAL → APPROVED → DEPLOYING → VERIFYING → SUCCEEDED.

Failure/rollback branches:
- Any build/test failure → FAILED with logs/evidence.
- Deployment failure → FAILED; rollback only under an approved rollback procedure.
- Verified rollback → ROLLED_BACK with prior release reference and audit evidence.

Rules:
- Preview/staging and production are distinct targets.
- Production approval binds to exact commit/build, target environment and deployment plan.
- Customer approval and internal release approval are distinct where both are required.
- No production deployment occurs merely because an agent or CI job reports success.
- Verify health, routes, key workflows, data integrity and backups after deployment.

## 8. Approval request lifecycle

Proposed states:
PENDING → APPROVED / REJECTED / EXPIRED / WITHDRAWN.

Every approval request records:
- Requesting actor and requested action.
- Target entity and immutable version/reference.
- Risk category and reason.
- Evidence/context shown to approver.
- Decision maker, timestamp, decision and optional comment.
- Idempotency/correlation reference to the action being authorized.

An approval cannot be reused for a different artifact, amount, customer, environment or action.

## 9. State-machine implementation requirements

- Implement transitions in domain services, not ad hoc controller code.
- Enforce valid transitions and actor permissions on the server.
- Use a database transaction for state update + event + audit record.
- Use optimistic concurrency/version checks to prevent conflicting updates.
- Idempotency protects retried transition commands.
- Keep a transition table and tests for every allowed and forbidden edge.
- UI status labels are localized separately from stable internal enum keys.
- Never allow arbitrary admin configuration to remove protected lifecycle gates.
