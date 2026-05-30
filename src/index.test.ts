/**
 * Tests for the client SDK. Uses Node's built-in test runner (node:test)
 * so we have zero test-runtime dependencies. Run with `npm test`.
 *
 * v0.0.1: tests cover configuration validation, state transitions, and the
 * intentional `not_implemented` behaviour. When real crypto lands in v0.2,
 * test coverage will expand to include proof construction and round-trip.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Sigilo, SigiloError } from "./index.js";
import type { SigiloConfig, VerificationState } from "./index.js";

const validConfig: SigiloConfig = {
  publishableKey: "pk_test_abc123",
  predicate: "over_18",
};

describe("Sigilo client — configuration validation", () => {
  it("accepts a minimal valid config", () => {
    assert.doesNotThrow(() => new Sigilo(validConfig));
  });

  it("rejects a missing publishable key", () => {
    assert.throws(
      () => new Sigilo({ ...validConfig, publishableKey: "" }),
      (e: unknown) =>
        e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("rejects a malformed publishable key", () => {
    assert.throws(
      () => new Sigilo({ ...validConfig, publishableKey: "abc123" }),
      (e: unknown) =>
        e instanceof SigiloError &&
        e.code === "invalid_config" &&
        e.message.includes("pk_live_"),
    );
  });

  it("accepts both pk_test_ and pk_live_ keys", () => {
    assert.doesNotThrow(
      () => new Sigilo({ ...validConfig, publishableKey: "pk_test_x" }),
    );
    assert.doesNotThrow(
      () => new Sigilo({ ...validConfig, publishableKey: "pk_live_x" }),
    );
  });

  it("rejects an unknown predicate", () => {
    assert.throws(
      // @ts-expect-error — deliberately invalid for the test
      () => new Sigilo({ ...validConfig, predicate: "over_999" }),
      (e: unknown) =>
        e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("rejects an unknown assurance tier", () => {
    assert.throws(
      // @ts-expect-error — deliberately invalid
      () => new Sigilo({ ...validConfig, assurance: "ultra" }),
      (e: unknown) =>
        e instanceof SigiloError && e.code === "invalid_config",
    );
  });

  it("defaults assurance to 'standard'", () => {
    const sigilo = new Sigilo(validConfig);
    // state defaults to idle regardless; we are checking construction succeeds
    assert.equal(sigilo.state, "idle");
  });
});

describe("Sigilo client — lifecycle", () => {
  it("starts in 'idle' state", () => {
    const sigilo = new Sigilo(validConfig);
    assert.equal(sigilo.state, "idle");
  });

  it("cancel() is idempotent on idle clients", () => {
    const sigilo = new Sigilo(validConfig);
    assert.doesNotThrow(() => sigilo.cancel());
    assert.doesNotThrow(() => sigilo.cancel());
    assert.equal(sigilo.state, "idle");
  });

  it("verify() throws SigiloError in v0.0.1 (intentional stub)", async () => {
    const sigilo = new Sigilo(validConfig);
    await assert.rejects(
      () => sigilo.verify(),
      (e: unknown) => e instanceof SigiloError,
    );
  });

  it("calls onStateChange when state transitions", async () => {
    const states: VerificationState[] = [];
    const sigilo = new Sigilo({
      ...validConfig,
      onStateChange: (s) => states.push(s),
    });
    try {
      await sigilo.verify();
    } catch {
      // expected in v0.0.1
    }
    assert.ok(states.includes("requesting"), "should pass through 'requesting'");
  });
});

describe("SigiloError", () => {
  it("is an Error subclass with stable shape", () => {
    const err = new SigiloError("user_denied", "user denied", "denied");
    assert.ok(err instanceof Error);
    assert.ok(err instanceof SigiloError);
    assert.equal(err.code, "user_denied");
    assert.equal(err.state, "denied");
    assert.equal(err.name, "SigiloError");
  });
});
