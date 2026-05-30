/**
 * Sigilo — server-side presentation verifier
 *
 * The server-side verifier is the security boundary for the relying party.
 * The browser SDK is convenient for orchestration but cannot be trusted to
 * report verification results — a malicious user could trivially fake them.
 *
 * The typical integration pattern:
 *
 *   1. Browser SDK calls sigilo.verify() and receives a VerificationResult.
 *   2. Browser POSTs result.presentation to your server.
 *   3. Server calls verifyPresentation() (this file) and trusts ONLY its
 *      return value. The browser-side `verified: true` is informational.
 *
 * The server-side verifier:
 *   - Cryptographically verifies the BBS+ proof against Sigilo's published
 *     network keys (no network call needed — keys are pinned).
 *   - Confirms the predicate matches what was requested.
 *   - Confirms the nonce matches what your server issued (replay protection).
 *   - Confirms the assurance tier meets your requirement.
 *
 * This file does NOT use the publishable key. Use a secret key (sk_live_...)
 * issued from the Sigilo dashboard, stored in your server's secret manager.
 *
 * ---
 *
 * IMPORTANT — v0.0.1 STATUS
 *
 * The verifier currently throws `not_implemented`. Real cryptographic
 * verification ships in v0.2 against audited libraries. Track at
 * https://sigilo.id/status.
 */

import { SigiloError, type Predicate, type AssuranceTier } from "./types.js";

export interface VerifyPresentationOptions {
  /**
   * The opaque presentation string from VerificationResult.presentation.
   */
  presentation: string;

  /**
   * The predicate you required. Must match what the browser requested,
   * otherwise verification fails.
   */
  expectedPredicate: Predicate;

  /**
   * The minimum assurance tier you require. Higher tiers will pass; lower
   * tiers will fail.
   */
  minAssurance?: AssuranceTier;

  /**
   * The nonce your server issued for this request. Used to prevent replay.
   * REQUIRED for production use. If you skip nonce checking, an attacker
   * can replay the same presentation across multiple actions.
   */
  expectedNonce: string;

  /**
   * Maximum age of the presentation in milliseconds. Defaults to 5 minutes.
   * Presentations older than this are rejected.
   */
  maxAgeMs?: number;
}

export interface VerifiedPresentation {
  /**
   * The predicate that was proven. Guaranteed to equal `expectedPredicate`
   * if this value is returned (we throw otherwise).
   */
  predicate: Predicate;

  /**
   * The actual assurance tier delivered. Guaranteed to be at least
   * `minAssurance`.
   */
  assurance: AssuranceTier;

  /**
   * Opaque proof identifier. Store this alongside the action you gated
   * with this verification. Useful for regulatory audit trails.
   */
  proofId: string;

  /**
   * When the presentation was generated (ISO 8601 UTC).
   */
  presentedAt: string;

  /**
   * The issuer's trust framework category — Tier 1, 2, or 3.
   * Issuer identity itself is NOT revealed.
   */
  issuerTier: 1 | 2 | 3;
}

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000;

/**
 * Verify a presentation. Returns the verified attributes on success; throws
 * `SigiloError` on any failure mode.
 *
 * This function is synchronous in spirit but returns a Promise to allow
 * future implementations to do non-blocking crypto on background threads.
 *
 * @param secretKey Your Sigilo secret key (sk_live_... or sk_test_...).
 *                  Never expose this to the browser.
 * @param options   What you're verifying and what you require.
 *
 * @example
 * ```ts
 * import { verifyPresentation } from "@sigilo/verify/server";
 *
 * app.post("/verify", async (req, res) => {
 *   try {
 *     const verified = await verifyPresentation(process.env.SIGILO_SECRET, {
 *       presentation: req.body.presentation,
 *       expectedPredicate: "over_18",
 *       minAssurance: "high",
 *       expectedNonce: req.session.verificationNonce,
 *     });
 *     // grant access — verified.predicate is "over_18", verified.assurance >= "high"
 *   } catch (e) {
 *     // deny access — log e.code for analytics, never expose to user
 *   }
 * });
 * ```
 */
export async function verifyPresentation(
  secretKey: string,
  options: VerifyPresentationOptions,
): Promise<VerifiedPresentation> {
  // Argument validation (no crypto required for this part).
  validateSecretKey(secretKey);
  validateOptions(options);

  // STUB: real implementation will
  //   1. Decode the presentation (a JWS-wrapped BBS+ proof).
  //   2. Verify the BBS+ signature against Sigilo's pinned network public key.
  //   3. Confirm the predicate claim matches options.expectedPredicate.
  //   4. Confirm the nonce claim matches options.expectedNonce.
  //   5. Confirm the issuer tier claim meets options.minAssurance.
  //   6. Confirm the presentation age is within options.maxAgeMs.
  throw new SigiloError(
    "server_error",
    "Sigilo server-side verifier v0.0.1 is a stub. Real cryptographic verification ships in v0.2 against audited libraries. Track at https://sigilo.id/status.",
    "failed",
  );
}

function validateSecretKey(secretKey: string): void {
  if (!secretKey || typeof secretKey !== "string") {
    throw new SigiloError(
      "invalid_config",
      "secretKey is required and must be a string",
      "failed",
    );
  }
  if (!secretKey.startsWith("sk_live_") && !secretKey.startsWith("sk_test_")) {
    throw new SigiloError(
      "invalid_config",
      "secretKey must start with 'sk_live_' or 'sk_test_'. Never use a publishable key (pk_) here.",
      "failed",
    );
  }
}

function validateOptions(options: VerifyPresentationOptions): void {
  if (!options.presentation || typeof options.presentation !== "string") {
    throw new SigiloError(
      "invalid_config",
      "presentation is required",
      "failed",
    );
  }
  if (!options.expectedPredicate) {
    throw new SigiloError(
      "invalid_config",
      "expectedPredicate is required — never verify a proof without specifying what it proves",
      "failed",
    );
  }
  if (!options.expectedNonce) {
    throw new SigiloError(
      "invalid_config",
      "expectedNonce is required for replay protection. Generate a unique nonce per request and pass it in both the browser request and this verification.",
      "failed",
    );
  }
  const maxAgeMs = options.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  if (maxAgeMs <= 0 || maxAgeMs > 24 * 60 * 60 * 1000) {
    throw new SigiloError(
      "invalid_config",
      "maxAgeMs must be positive and no more than 24 hours",
      "failed",
    );
  }
}

// Re-export types relevant to server-side use.
export { SigiloError } from "./types.js";
export type { Predicate, AssuranceTier } from "./types.js";
