/**
 * Tests for the server-side verifier. The v0.0.1 stub is heavily tested on
 * its input validation — these are the checks that will continue to apply
 * once real cryptography lands, so they are written to be permanent.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyPresentation, SigiloError } from "./server.js";
import type { VerifyPresentationOptions } from "./server.js";

const validSecret = "sk_test_abc";
const validOptions: VerifyPresentationOptions = {
  presentation: "stub-presentation-blob",
  expectedPredicate: "over_18",
  expectedNonce: "nonce-from-server",
};

describe("verifyPresentation — secret key validation", () => {
  it("rejects an empty secret key", async () => {
    await assert.rejects(
      () => verifyPresentation("", validOptions),
      (e: unknown) =>
        e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("rejects a publishable key passed as secret", async () => {
    await assert.rejects(
      () => verifyPresentation("pk_live_abc", validOptions),
      (e: unknown) =>
        e instanceof SigiloError &&
        e.code === "invalid_config" &&
        e.message.includes("Never use a publishable key"),
    );
  });

  it("accepts sk_test_ and sk_live_ keys", async () => {
    for (const sk of ["sk_test_abc", "sk_live_abc"]) {
      // these will fail at the not_implemented step, but only AFTER
      // validation passes — code === server_error confirms validation succeeded
      try {
        await verifyPresentation(sk, validOptions);
        assert.fail("expected to throw not_implemented");
      } catch (e) {
        assert.ok(e instanceof SigiloError);
        assert.equal(e.code, "server_error");
      }
    }
  });
});

describe("verifyPresentation — options validation", () => {
  it("requires a presentation", async () => {
    await assert.rejects(
      () => verifyPresentation(validSecret, { ...validOptions, presentation: "" }),
      (e: unknown) => e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("requires expectedPredicate", async () => {
    await assert.rejects(
      // @ts-expect-error — deliberately invalid
      () => verifyPresentation(validSecret, { ...validOptions, expectedPredicate: undefined }),
      (e: unknown) => e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("requires expectedNonce (replay protection is mandatory)", async () => {
    await assert.rejects(
      // @ts-expect-error — deliberately invalid
      () => verifyPresentation(validSecret, { ...validOptions, expectedNonce: undefined }),
      (e: unknown) =>
        e instanceof SigiloError &&
        e.code === "invalid_config" &&
        e.message.includes("replay"),
    );
  });

  it("rejects an absurdly large maxAgeMs", async () => {
    await assert.rejects(
      () =>
        verifyPresentation(validSecret, {
          ...validOptions,
          maxAgeMs: 48 * 60 * 60 * 1000, // 48 hours, over the 24h cap
        }),
      (e: unknown) => e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("rejects a zero or negative maxAgeMs", async () => {
    await assert.rejects(
      () => verifyPresentation(validSecret, { ...validOptions, maxAgeMs: 0 }),
      (e: unknown) => e instanceof SigiloError && e.code === "invalid_config",
    );
    await assert.rejects(
      () => verifyPresentation(validSecret, { ...validOptions, maxAgeMs: -1 }),
      (e: unknown) => e instanceof SigiloError && e.code === "invalid_config",
    );
  });
});

describe("verifyPresentation — v0.0.1 stub behaviour", () => {
  it("returns server_error pointing to status page", async () => {
    try {
      await verifyPresentation(validSecret, validOptions);
      assert.fail("expected stub to throw");
    } catch (e) {
      assert.ok(e instanceof SigiloError);
      assert.equal(e.code, "server_error");
      assert.match(e.message, /v0\.0\.1|stub|sigilo\.id\/status/);
    }
  });
});
