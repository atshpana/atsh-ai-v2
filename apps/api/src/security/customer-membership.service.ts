import type { CustomerMembershipStatus } from "./customer-membership.policy.js";
import { isAllowedCustomerMembershipTransition } from "./customer-membership.lifecycle.js";

export type MembershipAction = "ACCEPT" | "SUSPEND" | "REMOVE" | "REINSTATE";
export type MembershipRecord = { id: string; customerId: string; userId: string; status: CustomerMembershipStatus; invitedAt: Date | null; acceptedAt: Date | null; suspendedAt: Date | null; removedAt: Date | null };
export type MembershipActor = { userId: string; actorType: "USER" | "SYSTEM" | "AGENT"; requestId?: string };
export type MembershipAudit = { actorType: MembershipActor["actorType"]; actorUserId: string | null; action: string; entityType: "CustomerMembership"; entityId: string; beforeData: Record<string, unknown>; afterData: Record<string, unknown>; requestId: string | null };

export interface CustomerMembershipTransaction {
  findMembership(id: string): Promise<MembershipRecord | null>;
  updateMembership(input: { id: string; expectedStatus: CustomerMembershipStatus; status: CustomerMembershipStatus; acceptedAt: Date | null; suspendedAt: Date | null; removedAt: Date | null }): Promise<MembershipRecord | null>;
  createAuditEvent(event: MembershipAudit): Promise<void>;
}
export interface CustomerMembershipUnitOfWork { transaction<T>(work: (tx: CustomerMembershipTransaction) => Promise<T>): Promise<T> }
export interface CustomerMembershipAuthorizer { assertCanTransition(actor: MembershipActor, membership: MembershipRecord, action: MembershipAction): Promise<void> }

export class CustomerMembershipConflictError extends Error { constructor(message: string) { super(message); this.name = "CustomerMembershipConflictError"; } }

/**
 * Transactional application service. The authorizer MUST validate a trusted,
 * authenticated principal and the actor's account-scoped permission. This
 * service deliberately does not infer roles from the unresolved roleKey catalogue.
 */
export class CustomerMembershipService {
  constructor(private readonly unitOfWork: CustomerMembershipUnitOfWork, private readonly authorizer: CustomerMembershipAuthorizer, private readonly now: () => Date = () => new Date()) {}

  async transition(input: { membershipId: string; actor: MembershipActor; action: MembershipAction }): Promise<MembershipRecord> {
    return this.unitOfWork.transaction(async (tx) => {
      const current = await tx.findMembership(input.membershipId);
      if (!current) throw new CustomerMembershipConflictError("Membership not found");
      await this.authorizer.assertCanTransition(input.actor, current, input.action);
      const target = this.targetStatus(input.action);
      if (!isAllowedCustomerMembershipTransition({ from: current.status, to: target })) {
        throw new CustomerMembershipConflictError("Membership transition is not allowed");
      }
      const timestamp = this.now();
      const updated = await tx.updateMembership({
        id: current.id, expectedStatus: current.status, status: target,
        acceptedAt: target === "ACTIVE" ? (current.acceptedAt ?? timestamp) : current.acceptedAt,
        suspendedAt: target === "SUSPENDED" ? timestamp : (current.status === "SUSPENDED" ? null : current.suspendedAt),
        removedAt: target === "REMOVED" ? timestamp : current.removedAt
      });
      if (!updated) throw new CustomerMembershipConflictError("Membership changed concurrently; retry the operation");
      await tx.createAuditEvent({
        actorType: input.actor.actorType, actorUserId: input.actor.actorType === "USER" ? input.actor.userId : null,
        action: `customer_membership.${input.action.toLowerCase()}`, entityType: "CustomerMembership", entityId: current.id,
        beforeData: { customerId: current.customerId, userId: current.userId, status: current.status },
        afterData: { customerId: updated.customerId, userId: updated.userId, status: updated.status }, requestId: input.actor.requestId ?? null
      });
      return updated;
    });
  }

  private targetStatus(action: MembershipAction): CustomerMembershipStatus {
    switch (action) {
      case "ACCEPT": return "ACTIVE";
      case "SUSPEND": return "SUSPENDED";
      case "REMOVE": return "REMOVED";
      case "REINSTATE": return "ACTIVE";
    }
  }
}
