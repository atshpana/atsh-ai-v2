import test from "node:test";
import assert from "node:assert/strict";
import { hasActiveCustomerMembership } from "./customer-membership.policy.js";

const active = { userId: "user-a", customerId: "customer-a", status: "ACTIVE" as const };

test("active membership grants access only to its own customer account", () => {
  assert.equal(hasActiveCustomerMembership({ principalUserId: "user-a", resourceCustomerId: "customer-a", memberships: [active] }), true);
  assert.equal(hasActiveCustomerMembership({ principalUserId: "user-a", resourceCustomerId: "customer-b", memberships: [active] }), false);
});

test("pending, suspended and removed memberships never grant access", () => {
  for (const status of ["INVITED", "SUSPENDED", "REMOVED"] as const) {
    assert.equal(hasActiveCustomerMembership({ principalUserId: "user-a", resourceCustomerId: "customer-a", memberships: [{ ...active, status }] }), false);
  }
});

test("missing principal or resource ownership fails closed", () => {
  assert.equal(hasActiveCustomerMembership({ principalUserId: null, resourceCustomerId: "customer-a", memberships: [active] }), false);
  assert.equal(hasActiveCustomerMembership({ principalUserId: "user-a", resourceCustomerId: null, memberships: [active] }), false);
});

test("membership for another user cannot authorize this principal", () => {
  assert.equal(hasActiveCustomerMembership({ principalUserId: "user-b", resourceCustomerId: "customer-a", memberships: [active] }), false);
});
