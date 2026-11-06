import type { CustomerMembershipStatus } from "./customer-membership.policy.js";

export type CustomerMembershipTransition = { from: CustomerMembershipStatus; to: CustomerMembershipStatus };

// State validity only. This does not authorize the actor or persist/audit a transition.
const ALLOWED: Readonly<Record<CustomerMembershipStatus, readonly CustomerMembershipStatus[]>> = {
  INVITED: ["ACTIVE", "REMOVED"],
  ACTIVE: ["SUSPENDED", "REMOVED"],
  SUSPENDED: ["ACTIVE", "REMOVED"],
  REMOVED: []
};

export function isAllowedCustomerMembershipTransition({ from, to }: CustomerMembershipTransition): boolean {
  return ALLOWED[from].includes(to);
}
