import {
  createHmac,
  timingSafeEqual,
  randomBytes
} from "node:crypto";

const b64url = (value) => Buffer.from(value).toString("base64url");
const fromB64url = (value) => Buffer.from(value, "base64url");

export function validateProviderCallback(input, expected) {
  return Boolean(
    input &&
    expected &&
    input.state &&
    input.nonce &&
    input.codeVerifier &&
    input.redirectUri === expected.redirectUri &&
    safeEqual(input.state, expected.state) &&
    safeEqual(input.nonce, expected.nonce) &&
    safeEqual(input.codeVerifier, expected.codeVerifier) &&
    input.issuer === expected.issuer
  );
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createOpaqueSession() {
  return randomBytes(32).toString("base64url");
}

export function browserSessionCookie(sessionId) {
  if (!sessionId || typeof sessionId !== "string") throw new Error("session id required");
  return {
    name: "__Host-atsh_session",
    value: sessionId,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    domain: undefined
  };
}

export function csrfAllowed({ requestOrigin, trustedOrigin, method }) {
  const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
  if (safeMethods.has(String(method).toUpperCase())) return true;
  return Boolean(requestOrigin && trustedOrigin && requestOrigin === trustedOrigin);
}

export function signAtshAssertion(payload, { keyId, secret }) {
  if (!payload || !keyId || !secret) throw new Error("assertion inputs required");
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "ATSH", kid: keyId }));
  const body = b64url(JSON.stringify(payload));
  const unsigned = header + "." + body;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return unsigned + "." + signature;
}

export function verifyAtshAssertion(token, {
  keys,
  issuer,
  audience,
  now = Math.floor(Date.now() / 1000)
}) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return { ok: false, reason: "malformed" };
    const header = JSON.parse(fromB64url(parts[0]).toString("utf8"));
    const payload = JSON.parse(fromB64url(parts[1]).toString("utf8"));
    if (header.alg !== "HS256" || header.typ !== "ATSH") return { ok: false, reason: "algorithm" };
    const secret = keys?.[header.kid];
    if (!secret) return { ok: false, reason: "unknown_key" };
    const expected = createHmac("sha256", secret)
      .update(parts[0] + "." + parts[1]).digest();
    const actual = fromB64url(parts[2]);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return { ok: false, reason: "signature" };
    }
    if (payload.iss !== issuer) return { ok: false, reason: "issuer" };
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(audience)) return { ok: false, reason: "audience" };
    if (!Number.isInteger(payload.exp) || payload.exp <= now) return { ok: false, reason: "expired" };
    if (!payload.sub || !payload.sid) return { ok: false, reason: "principal" };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}

export function createIdentityFixture() {
  return {
    users: new Set(["individual-owner", "company-owner", "company-member", "staff-user", "other-owner"]),
    customers: new Map([
      ["individual-customer", { organizationId: null }],
      ["company-customer", { organizationId: "company-profile" }],
      ["other-customer", { organizationId: "other-profile" }]
    ]),
    organizations: new Set(["company-profile", "other-profile"]),
    memberships: [
      { userId: "individual-owner", customerId: "individual-customer", status: "active", role: "owner" },
      { userId: "company-owner", customerId: "company-customer", status: "active", role: "owner" },
      { userId: "company-member", customerId: "company-customer", status: "active", role: "member" },
      { userId: "other-owner", customerId: "other-customer", status: "active", role: "owner" }
    ],
    revokedSessions: new Set(),
    keys: { "key-current": "synthetic-test-secret-current", "key-next": "synthetic-test-secret-next" }
  };
}

export function hasCustomerAccess(state, userId, customerId) {
  return state.memberships.some(
    (m) => m.userId === userId && m.customerId === customerId && m.status === "active"
  );
}

export function canAccessResource(state, userId, resource) {
  return Boolean(resource && hasCustomerAccess(state, userId, resource.customerId));
}

export function revokeMembership(state, userId, customerId) {
  for (const membership of state.memberships) {
    if (membership.userId === userId && membership.customerId === customerId) {
      membership.status = "revoked";
    }
  }
}

export function acceptMembershipOnce(state, membership) {
  const existing = state.memberships.find(
    (m) => m.userId === membership.userId && m.customerId === membership.customerId
  );
  if (existing) {
    if (existing.status !== "active") existing.status = membership.status;
    return existing;
  }
  state.memberships.push({ ...membership });
  return state.memberships[state.memberships.length - 1];
}

export function sessionIsActive(state, sessionId) {
  return Boolean(sessionId && !state.revokedSessions.has(sessionId));
}

export function revokeSession(state, sessionId) {
  state.revokedSessions.add(sessionId);
}

export function audienceAllows(assertion, expectedAudience) {
  const aud = Array.isArray(assertion?.aud) ? assertion.aud : [assertion?.aud];
  return aud.includes(expectedAudience);
}
