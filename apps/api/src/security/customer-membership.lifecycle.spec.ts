import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedCustomerMembershipTransition } from "./customer-membership.lifecycle.js";

test("invitation can be accepted or withdrawn, but cannot bypass activation", () => {
  assert.equal(isAllowedCustomerMembershipTransition({ from: "INVITED", to: "ACTIVE" }), true);
  assert.equal(isAllowedCustomerMembershipTransition({ from: "INVITED", to: "REMOVED" }), true);
  assert.equal(isAllowedCustomerMembershipTransition({ from: "INVITED", to: "SUSPENDED" }), false);
});

test("active membership can be suspended or removed", () => {
  assert.equal(isAllowedCustomerMembershipTransition({ from: "ACTIVE", to: "SUSPENDED" }), true);
  assert.equal(isAllowedCustomerMembershipTransition({ from: "ACTIVE", to: "REMOVED" }), true);
  assert.equal(isAllowedCustomerMembershipTransition({ from: "ACTIVE", to: "INVITED" }), false);
});

test("suspended membership can be reinstated or removed", () => {
  assert.equal(isAllowedCustomerMembershipTransition({ from: "SUSPENDED", to: "ACTIVE" }), true);
  assert.equal(isAllowedCustomerMembershipTransition({ from: "SUSPENDED", to: "REMOVED" }), true);
});

test("removed membership is terminal", () => {
  for (const to of ["INVITED", "ACTIVE", "SUSPENDED", "REMOVED"] as const) {
    assert.equal(isAllowedCustomerMembershipTransition({ from: "REMOVED", to }), false);
  }
});
