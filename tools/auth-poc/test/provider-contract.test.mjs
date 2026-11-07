import test from "node:test";
import assert from "node:assert/strict";
import {
  assertProviderAdapter,
  validateNormalizedIdentity,
  externalIdentityKey,
  createSyntheticAdapter
} from "../src/provider-contract.mjs";

const providers = ["workos", "clerk", "cognito"];

for (const provider of providers) {
  test(`CONTRACT ${provider}: exposes the provider-neutral adapter interface`, () => {
    const adapter = createSyntheticAdapter(provider);
    assert.equal(assertProviderAdapter(adapter), adapter);
  });

  test(`CONTRACT ${provider}: accepts only a fully validated callback`, async () => {
    const adapter = createSyntheticAdapter(provider);
    const expected = { state: "state-1", nonce: "nonce-1", codeVerifier: "pkce-verifier", redirectUri: "https://app.example.test/callback", audience: "atsh-customer-api" };
    const valid = { ...expected, issuer: `https://${provider}.provider.test`, signatureValid: true, subject: "subject-123" };
    assert.equal((await adapter.verifyCallback(valid, expected)).ok, true);
    for (const mutation of [
      { state: "bad" }, { nonce: "bad" }, { codeVerifier: "bad" },
      { redirectUri: "https://evil.test/callback" }, { audience: "atsh-staff-api" },
      { issuer: "https://evil.test" }, { signatureValid: false }, { replayed: true }
    ]) {
      assert.equal((await adapter.verifyCallback({ ...valid, ...mutation }, expected)).ok, false);
    }
  });

  test(`CONTRACT ${provider}: normalizes stable issuer-subject identity, never email identity`, async () => {
    const adapter = createSyntheticAdapter(provider);
    const profile = await adapter.getUserProfile("subject-123");
    const normalized = validateNormalizedIdentity(adapter.normalizeIdentity(profile));
    assert.equal(normalized.ok, true);
    assert.equal(normalized.identity.subject, "subject-123");
    assert.equal(normalized.identity.emailVerified, true);
    assert.equal(externalIdentityKey(normalized.identity), `https://${provider}.provider.test\u0000subject-123`);
  });
}

test("CONTRACT rejects missing or malformed identity claims", () => {
  assert.equal(validateNormalizedIdentity(null).ok, false);
  assert.equal(validateNormalizedIdentity({ issuer: "not-url", subject: "s", emailVerified: true }).ok, false);
  assert.equal(validateNormalizedIdentity({ issuer: "https://idp.test", subject: "", emailVerified: true }).ok, false);
  assert.equal(validateNormalizedIdentity({ issuer: "https://idp.test", subject: "s" }).ok, false);
});

test("CONTRACT external identity is keyed by issuer plus subject, not email", () => {
  const a = { issuer: "https://idp-a.test", subject: "same-subject", email: "same@example.test", emailVerified: true };
  const b = { issuer: "https://idp-b.test", subject: "same-subject", email: "same@example.test", emailVerified: true };
  assert.notEqual(externalIdentityKey(a), externalIdentityKey(b));
});
