/**
 * Sigilo — relying-party browser SDK
 *
 * The client SDK runs on the relying party's web page. It is responsible for:
 *   1. Initiating a verification request to the Sigilo network
 *   2. Opening the user's wallet (deep link, QR code, or browser-native API)
 *   3. Receiving the presented proof
 *   4. Returning a result the relying party's server can verify
 *
 * The client SDK is convenient but NOT the security boundary. Always verify
 * the resulting presentation server-side with `@sigilo/verify/server` before
 * granting access. The publishable key in this SDK is safe to ship in browser
 * bundles; the secret key required for server-side verification is not.
 *
 * ---
 *
 * IMPORTANT — v0.0.1 STATUS
 *
 * This is the v0 namespace-reservation release. The API surface below is
 * stable and reflects the intended production shape. The network and
 * cryptographic operations are stubbed: every method that would touch
 * the Sigilo network or generate/verify a proof throws `not_implemented`.
 *
 * Real cryptography will be wired in v0.2 against the Google ZKAccess /
 * iden3 / EUDI reference libraries, after independent audit. Do NOT use this
 * package in production until v1.0.
 */

import {
  type SigiloConfig,
  type VerificationResult,
  type VerificationState,
  type Predicate,
  type AssuranceTier,
  SigiloError,
} from "./types.js";

const DEFAULT_BASE_URL = "https://api.sigilo.id";
/** @internal — used by future network requests. */
// @ts-expect-error v0.0.1 stub: used in v0.2 when network is wired up
const _PROTOCOL_VERSION = "sigilo/0.1";
const SUPPORTED_PREDICATES: readonly Predicate[] = [
  "over_13",
  "over_16",
  "over_18",
  "over_21",
  "over_25",
];
const SUPPORTED_TIERS: readonly AssuranceTier[] = [
  "estimation",
  "standard",
  "high",
];

/**
 * The main relying-party client. Construct once per page (or per React tree
 * via a context provider) and call `verify()` when you need a fresh proof.
 */
export class Sigilo {
  // v0.0.1 stubs: these fields are stored but not yet used. They will be
  // consumed by the network and crypto layers in v0.2. Marked with leading
  // underscore to silence noUnusedLocals while keeping the public types
  // and the constructor shape stable across the v0 -> v1 evolution.
  /** @internal */ readonly #_publishableKey: string;
  /** @internal */ readonly #_predicate: Predicate;
  /** @internal */ readonly #_assurance: AssuranceTier;
  /** @internal */ readonly #_baseUrl: string;
  /** @internal */ readonly #_locale: string;
  readonly #onStateChange: ((state: VerificationState) => void) | undefined;

  #state: VerificationState = "idle";

  constructor(config: SigiloConfig) {
    Sigilo.#validateConfig(config);
    this.#_publishableKey = config.publishableKey;
    this.#_predicate = config.predicate;
    this.#_assurance = config.assurance ?? "standard";
    this.#_baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.#_locale = config.locale ?? Sigilo.#detectLocale();
    this.#onStateChange = config.onStateChange;
    // Touch fields so noUnusedLocals is satisfied; these reads have no
    // runtime effect.
    void this.#_publishableKey;
    void this.#_predicate;
    void this.#_assurance;
    void this.#_baseUrl;
    void this.#_locale;
  }

  /**
   * The current state of any in-flight verification. Useful for UI rendering.
   */
  get state(): VerificationState {
    return this.#state;
  }

  /**
   * Initiate a verification. Returns when the user has either approved (with
   * a verifiable proof attached) or denied. Throws `SigiloError` on any other
   * outcome.
   *
   * @example
   * ```ts
   * const sigilo = new Sigilo({
   *   publishableKey: "pk_live_...",
   *   predicate: "over_18",
   *   assurance: "high",
   * });
   *
   * try {
   *   const result = await sigilo.verify();
   *   if (result.verified) {
   *     // POST result.presentation to your server for verification
   *   }
   * } catch (e) {
   *   if (e instanceof SigiloError && e.code === "user_denied") {
   *     // show a friendly "we couldn't verify your age" message
   *   }
   * }
   * ```
   */
  async verify(): Promise<VerificationResult> {
    this.#setState("requesting");

    // STUB: real implementation will POST to /v1/presentation-requests on the
    // Sigilo network, receive a one-time URL/QR, open the wallet, and await
    // the presented proof over a websocket back-channel.
    throw new SigiloError(
      "server_error",
      "Sigilo SDK v0.0.1 is a namespace-reservation release. Real cryptography ships in v0.2; production-ready releases are versioned >=1.0. Track progress at https://sigilo.id/status.",
      this.#state,
    );
  }

  /**
   * Cancel an in-flight verification, if any. Idempotent.
   */
  cancel(): void {
    if (this.#state === "idle" || this.#state === "verified") return;
    // STUB: real implementation will close the wallet connection and notify
    // the network so the presentation request is invalidated.
    this.#setState("idle");
  }

  // ─── internals ──────────────────────────────────────────────────────────

  #setState(state: VerificationState): void {
    this.#state = state;
    this.#onStateChange?.(state);
  }

  static #validateConfig(config: SigiloConfig): void {
    if (!config.publishableKey || typeof config.publishableKey !== "string") {
      throw new SigiloError(
        "invalid_config",
        "publishableKey is required and must be a string",
        "idle",
      );
    }
    if (
      !config.publishableKey.startsWith("pk_live_") &&
      !config.publishableKey.startsWith("pk_test_")
    ) {
      throw new SigiloError(
        "invalid_config",
        "publishableKey must start with 'pk_live_' or 'pk_test_'",
        "idle",
      );
    }
    if (!SUPPORTED_PREDICATES.includes(config.predicate)) {
      throw new SigiloError(
        "invalid_config",
        `predicate must be one of: ${SUPPORTED_PREDICATES.join(", ")}`,
        "idle",
      );
    }
    if (config.assurance && !SUPPORTED_TIERS.includes(config.assurance)) {
      throw new SigiloError(
        "invalid_config",
        `assurance must be one of: ${SUPPORTED_TIERS.join(", ")}`,
        "idle",
      );
    }
  }

  static #detectLocale(): string {
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en-US";
  }
}

// Re-export public types for convenient single-import consumption.
export {
  SigiloError,
} from "./types.js";

export type {
  SigiloConfig,
  VerificationResult,
  VerificationState,
  VerificationError,
  Predicate,
  AssuranceTier,
  SigiloErrorCode,
} from "./types.js";
