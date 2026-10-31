import test from "node:test";
import assert from "node:assert/strict";
import * as model from "../src/model.mjs";

const now = 1798000000;
const issuer = "https://auth.atsh.test";
const audience = "atsh-customer-api";
const keys = { "key-current": "synthetic-test-secret-current", "key-next": "synthetic-test-secret-next" };
const payload = { iss: issuer, aud: audience, sub: "company-member", sid: "session-synthetic-001", iat: now - 5, exp: now + 60 };

test("ARCH-01 callback validates state, nonce, verifier, issuer and redirect", () => {
  const expected = { state: "s1", nonce: "n1", codeVerifier: "v1", issuer: "https://idp.test", redirectUri: "https://app.test/callback" };
  assert.equal(model.validateProviderCallback(expected, expected), true);
  assert.equal(model.validateProviderCallback({ ...expected, state: "wrong" }, expected), false);
  assert.equal(model.validateProviderCallback({ ...expected, nonce: "wrong" }, expected), false);
  assert.equal(model.validateProviderCallback({ ...expected, codeVerifier: "wrong" }, expected), false);
  assert.equal(model.validateProviderCallback({ ...expected, issuer: "https://evil.test" }, expected), false);
  assert.equal(model.validateProviderCallback({ ...expected, redirectUri: "https://evil.test/callback" }, expected), false);
});

test("ARCH-02 browser session identifier is opaque and random", () => {
  const a = model.createOpaqueSession();
  const b = model.createOpaqueSession();
  assert.ok(a.length >= 40);
  assert.notEqual(a, b);
  assert.equal(a.includes("."), false);
});

test("ARCH-03 cookie is Secure, HttpOnly, host-only and root scoped", () => {
  const c = model.browserSessionCookie("opaque");
  assert.equal(c.httpOnly, true);
  assert.equal(c.secure, true);
  assert.equal(c.sameSite, "Lax");
  assert.equal(c.path, "/");
  assert.equal(c.domain, undefined);
  assert.ok(c.name.startsWith("__Host-"));
});

test("ARCH-04 cross-origin state-changing requests fail CSRF check", () => {
  assert.equal(model.csrfAllowed({ method: "POST", requestOrigin: "https://evil.test", trustedOrigin: "https://app.test" }), false);
  assert.equal(model.csrfAllowed({ method: "POST", requestOrigin: "https://app.test", trustedOrigin: "https://app.test" }), true);
  assert.equal(model.csrfAllowed({ method: "GET", requestOrigin: "https://evil.test", trustedOrigin: "https://app.test" }), true);
});

test("ARCH-05 assertion validation rejects malformed, expired, wrong issuer/audience and bad signature", () => {
  const sign = p => model.signAtshAssertion(p, { keyId: "key-current", secret: keys["key-current"] });
  const verify = t => model.verifyAtshAssertion(t, { keys, issuer, audience, now });
  assert.equal(verify(sign(payload)).ok, true);
  assert.equal(verify("not-a-token").ok, false);
  assert.equal(verify(sign({ ...payload, exp: now - 1 })).reason, "expired");
  assert.equal(verify(sign({ ...payload, iss: "https://evil.test" })).reason, "issuer");
  assert.equal(verify(sign({ ...payload, aud: "atsh-staff-api" })).reason, "audience");
  const valid = sign(payload);
  const altered = valid.slice(0, -1) + (valid.endsWith("a") ? "b" : "a");
  assert.equal(verify(altered).ok, false);
});

test("ARCH-06 membership revocation blocks the next access decision", () => {
  const s = model.createIdentityFixture();
  const resource = { customerId: "company-customer" };
  assert.equal(model.canAccessResource(s, "company-member", resource), true);
  model.revokeMembership(s, "company-member", "company-customer");
  assert.equal(model.canAccessResource(s, "company-member", resource), false);
});

test("ARCH-07 ATSH session revocation invalidates the session", () => {
  const s = model.createIdentityFixture();
  model.revokeSession(s, "session-1");
  assert.equal(model.sessionIsActive(s, "session-1"), false);
});

test("ARCH-08 key rotation accepts configured keys and rejects retired keys", () => {
  const old = model.signAtshAssertion(payload, { keyId: "key-current", secret: keys["key-current"] });
  const next = model.signAtshAssertion(payload, { keyId: "key-next", secret: keys["key-next"] });
  assert.equal(model.verifyAtshAssertion(old, { keys, issuer, audience, now }).ok, true);
  assert.equal(model.verifyAtshAssertion(next, { keys, issuer, audience, now }).ok, true);
  assert.equal(model.verifyAtshAssertion(old, { keys: { "key-next": keys["key-next"] }, issuer, audience, now }).reason, "unknown_key");
});

test("ARCH-09 repeated acceptance does not duplicate membership", () => {
  const s = model.createIdentityFixture();
  const count = s.memberships.length;
  const m = { userId: "company-member", customerId: "company-customer", status: "active", role: "member" };
  model.acceptMembershipOnce(s, m);
  model.acceptMembershipOnce(s, m);
  assert.equal(s.memberships.length, count);
  assert.equal(s.memberships.filter(x => x.userId === m.userId && x.customerId === m.customerId).length, 1);
});

test("ARCH-10 individual customer has access without an Organization", () => {
  const s = model.createIdentityFixture();
  assert.equal(s.customers.get("individual-customer").organizationId, null);
  assert.equal(model.hasCustomerAccess(s, "individual-owner", "individual-customer"), true);
  assert.equal(model.hasCustomerAccess(s, "company-owner", "individual-customer"), false);
});

test("ARCH-11 company access resolves through CustomerMembership records", () => {
  const s = model.createIdentityFixture();
  assert.equal(s.organizations.has("company-profile"), true);
  assert.equal(model.hasCustomerAccess(s, "company-owner", "company-customer"), true);
  assert.equal(model.hasCustomerAccess(s, "company-member", "company-customer"), true);
  assert.equal(s.memberships.filter(x => x.customerId === "company-customer").length, 2);
});

test("ARCH-12 customer audience is not accepted by staff audience", () => {
  const claim = { aud: "atsh-customer-api" };
  assert.equal(model.audienceAllows(claim, "atsh-customer-api"), true);
  assert.equal(model.audienceAllows(claim, "atsh-staff-api"), false);
});
