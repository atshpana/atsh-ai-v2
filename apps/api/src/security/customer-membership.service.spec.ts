import test from "node:test";
import assert from "node:assert/strict";
import { CustomerMembershipService, CustomerMembershipConflictError, type MembershipRecord, type CustomerMembershipTransaction, type CustomerMembershipUnitOfWork } from "./customer-membership.service.js";

function fixture(status: MembershipRecord["status"] = "INVITED") {
  let record: MembershipRecord = { id: "membership-1", customerId: "customer-a", userId: "user-a", status, invitedAt: new Date("2026-11-01T00:00:00Z"), acceptedAt: null, suspendedAt: null, removedAt: null };
  const audits: unknown[] = [];
  let failUpdate = false;
  const tx: CustomerMembershipTransaction = {
    findMembership: async (id) => id === record.id ? { ...record } : null,
    updateMembership: async (input) => {
      if (failUpdate || input.expectedStatus !== record.status) return null;
      record = { ...record, status: input.status, acceptedAt: input.acceptedAt, suspendedAt: input.suspendedAt, removedAt: input.removedAt };
      return { ...record };
    },
    createAuditEvent: async (event) => { audits.push(event); }
  };
  const uow: CustomerMembershipUnitOfWork = { transaction: async (work) => work(tx) };
  return { uow, audits, getRecord: () => record, setFailUpdate: (value: boolean) => { failUpdate = value; } };
}
const actor = { userId: "staff-1", actorType: "USER" as const, requestId: "req-123" };
const allow = { assertCanTransition: async () => {} };

 test("accept updates status and writes audit in the same transaction", async () => {
  const f = fixture();
  const service = new CustomerMembershipService(f.uow, allow, () => new Date("2026-11-06T12:00:00Z"));
  const result = await service.transition({ membershipId: "membership-1", actor, action: "ACCEPT" });
  assert.equal(result.status, "ACTIVE");
  assert.equal(result.acceptedAt?.toISOString(), "2026-11-06T12:00:00.000Z");
  assert.equal(f.audits.length, 1);
  assert.equal((f.audits[0] as { action: string }).action, "customer_membership.accept");
});

test("authorization failure prevents update and audit", async () => {
  const f = fixture();
  const deny = { assertCanTransition: async () => { throw new Error("forbidden"); } };
  const service = new CustomerMembershipService(f.uow, deny);
  await assert.rejects(service.transition({ membershipId: "membership-1", actor, action: "ACCEPT" }), /forbidden/);
  assert.equal(f.getRecord().status, "INVITED");
  assert.equal(f.audits.length, 0);
});

test("invalid state transition is rejected", async () => {
  const f = fixture("REMOVED");
  const service = new CustomerMembershipService(f.uow, allow);
  await assert.rejects(service.transition({ membershipId: "membership-1", actor, action: "REINSTATE" }), CustomerMembershipConflictError);
  assert.equal(f.audits.length, 0);
});

test("concurrent status change fails closed without audit", async () => {
  const f = fixture();
  f.setFailUpdate(true);
  const service = new CustomerMembershipService(f.uow, allow);
  await assert.rejects(service.transition({ membershipId: "membership-1", actor, action: "ACCEPT" }), /changed concurrently/);
  assert.equal(f.audits.length, 0);
});

test("missing membership is rejected", async () => {
  const f = fixture();
  const service = new CustomerMembershipService(f.uow, allow);
  await assert.rejects(service.transition({ membershipId: "missing", actor, action: "ACCEPT" }), /not found/);
});
