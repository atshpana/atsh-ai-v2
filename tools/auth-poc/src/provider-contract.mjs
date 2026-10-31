const REQUIRED_METHODS = ["verifyCallback", "getUserProfile", "normalizeIdentity"];

export function assertProviderAdapter(adapter) {
  if (!adapter || typeof adapter.name !== "string" || !adapter.name) {
    throw new TypeError("adapter.name is required");
  }
  for (const method of REQUIRED_METHODS) {
    if (typeof adapter[method] !== "function") {
      throw new TypeError(`adapter.${method} must be a function`);
    }
  }
  return adapter;
}

export function validateNormalizedIdentity(identity) {
  if (!identity || typeof identity !== "object") return { ok: false, reason: "missing_identity" };
  if (typeof identity.issuer !== "string" || !identity.issuer.startsWith("https://")) return { ok: false, reason: "invalid_issuer" };
  if (typeof identity.subject !== "string" || !identity.subject.trim()) return { ok: false, reason: "invalid_subject" };
  if (typeof identity.emailVerified !== "boolean") return { ok: false, reason: "email_verification_missing" };
  if (identity.email !== null && identity.email !== undefined && typeof identity.email !== "string") return { ok: false, reason: "invalid_email" };
  return { ok: true, identity: {
    issuer: identity.issuer,
    subject: identity.subject,
    email: identity.email ?? null,
    emailVerified: identity.emailVerified,
    displayName: identity.displayName ?? null
  } };
}

export function externalIdentityKey(identity) {
  const valid = validateNormalizedIdentity(identity);
  if (!valid.ok) throw new TypeError(valid.reason);
  return `${valid.identity.issuer}\u0000${valid.identity.subject}`;
}

export function createSyntheticAdapter(name) {
  const issuer = `https://${name}.provider.test`;
  return assertProviderAdapter({
    name,
    async verifyCallback(input, expected) {
      if (!input || !expected || input.state !== expected.state || input.nonce !== expected.nonce ||
          input.codeVerifier !== expected.codeVerifier || input.redirectUri !== expected.redirectUri ||
          input.issuer !== issuer || input.audience !== expected.audience ||
          input.signatureValid !== true || input.replayed === true) {
        return { ok: false, reason: "callback_rejected" };
      }
      return { ok: true, subject: input.subject };
    },
    async getUserProfile(subject) {
      return { sub: subject, iss: issuer, email: `user@${name}.example.test`, email_verified: true, name: "Synthetic User" };
    },
    normalizeIdentity(profile) {
      return {
        issuer: profile.iss,
        subject: profile.sub,
        email: profile.email,
        emailVerified: profile.email_verified,
        displayName: profile.name
      };
    }
  });
}
