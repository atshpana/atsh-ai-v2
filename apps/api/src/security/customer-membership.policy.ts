export type CustomerMembershipStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED";
export type CustomerMembershipGrant = { customerId: string; userId: string; status: CustomerMembershipStatus };

/** Pure policy check only: callers must authenticate the principal and resolve resource ownership from persisted data. */
export function hasActiveCustomerMembership(input: { principalUserId: string | null | undefined; resourceCustomerId: string | null | undefined; memberships: readonly CustomerMembershipGrant[] }): boolean {
  const { principalUserId, resourceCustomerId, memberships } = input;
  if (!principalUserId || !resourceCustomerId) return false;
  return memberships.some((membership) => membership.userId === principalUserId && membership.customerId === resourceCustomerId && membership.status === "ACTIVE");
}
