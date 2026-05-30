/**
 * Sigilo SDK — type definitions
 *
 * These types form the public contract of the SDK. They are stable across
 * patch versions; breaking changes will only occur on a major version bump.
 */

/**
 * The set of predicates the relying party can request a proof for.
 *
 * Each predicate is a yes/no question answered by the user's wallet using
 * a zero-knowledge proof. The relying party learns only the boolean result,
 * never the underlying attribute (e.g. the actual date of birth).
 *
 * Predicates are versioned by the Sigilo trust framework; new predicates may
 * be added in minor releases. Custom predicates require coordination with
 * Sigilo and an updated trust framework entry.
 */
export type Predicate =
  | "over_13"
  | "over_16"
  | "over_18"
  | "over_21"
  | "over_25";

/**
 * Assurance tier determines the strength of the underlying credential and
 * the liveness/binding checks performed at presentation time.
 *
 * - `estimation`: on-device facial age estimation. Suitable for COPPA-tier
 *   age gating where regulators accept estimation. Lowest cost, lowest
 *   assurance, no cryptographic credential involved.
 * - `standard`: a verifiable credential from any accredited Sigilo issuer,
 *   presented as a BBS+ zero-knowledge proof. Default for most use cases.
 * - `high`: a Tier 1 issuer credential (government mDL, passport NFC,
 *   EUDI Wallet) presented with on-device biometric liveness. Required for
 *   adult content under the UK Online Safety Act and equivalent regimes.
 */
export type AssuranceTier = "estimation" | "standard" | "high";

/**
 * Configuration for the Sigilo client.
 *
 * The publishable key is safe to ship in browser bundles. It identifies your
 * relying party to the Sigilo network and authorizes verification requests
 * to be issued in your name. It cannot be used to verify proofs server-side
 * (see `@sigilo/verify/server` for that).
 */
export interface SigiloConfig {
  /**
   * Your publishable key. Starts with `pk_test_` (sandbox) or `pk_live_`
   * (production). Issued from the Sigilo dashboard.
   */
  publishableKey: string;

  /**
   * The predicate to request. The user's wallet will prove this and only this.
   */
  predicate: Predicate;

  /**
   * The minimum acceptable assurance tier. Defaults to `"standard"`.
   *
   * If the user's wallet cannot satisfy the requested tier, the request fails
   * with `assurance_unmet` rather than silently downgrading.
   */
  assurance?: AssuranceTier;

  /**
   * Override the network base URL. For most callers this should be left
   * unset. Used internally for testing against staging environments.
   *
   * @internal
   */
  baseUrl?: string;

  /**
   * Optional locale hint passed to the user's wallet for UI localization.
   * Defaults to the user's browser locale. ISO 639-1 with optional region.
   */
  locale?: string;

  /**
   * Optional callback invoked when the verification state changes. Useful
   * for analytics and UX (e.g. dimming the page while the wallet is open).
   */
  onStateChange?: (state: VerificationState) => void;
}

/**
 * Lifecycle states a verification request progresses through.
 */
export type VerificationState =
  | "idle"
  | "requesting"        // SDK is contacting the network to mint a presentation request
  | "awaiting_wallet"   // user has the request open in their wallet
  | "presenting"        // wallet is generating and sending the proof
  | "verified"          // proof received and verified
  | "denied"            // user explicitly denied
  | "failed";           // network, validation, or other error

/**
 * The successful result of a verification.
 *
 * The relying party MUST treat `verified` as authoritative only after also
 * verifying the proof server-side (see `@sigilo/verify/server`). The client
 * SDK is convenient for orchestration but cannot be the security boundary.
 */
export interface VerificationResult {
  /** True iff the proof was generated, presented, and verified. */
  verified: boolean;

  /** The predicate that was proven (echoes the request). */
  predicate: Predicate;

  /** The assurance tier actually delivered (may equal or exceed the request). */
  assurance: AssuranceTier;

  /**
   * Opaque proof identifier for audit. Persist this alongside your record
   * of the verified action. Sigilo retains the proof receipt for the
   * minimum period required by applicable law; we cannot link it to a user.
   */
  proofId: string;

  /**
   * The fresh per-request nonce that prevents replay. Verify this matches
   * the nonce you (or your server) generated for this request.
   */
  nonce: string;

  /**
   * Server-verifiable presentation. Pass this to `verifyPresentation()` in
   * `@sigilo/verify/server` before granting access.
   */
  presentation: string;

  /** Network protocol version used. */
  protocolVersion: string;
}

/**
 * The complete failure shape. Note the absence of any PII even on failure —
 * we never expose which credential the user holds, who their issuer is, or
 * any other detail that could be used to re-identify them.
 */
export interface VerificationError {
  /** Stable machine-readable error code. */
  code: SigiloErrorCode;

  /** Human-readable explanation, safe to log. Never contains PII. */
  message: string;

  /** The state the verification was in when it failed. */
  state: VerificationState;
}

export type SigiloErrorCode =
  | "user_denied"          // user explicitly denied in their wallet
  | "user_canceled"        // user closed the wallet without responding
  | "timeout"              // wallet did not respond within the protocol window
  | "no_wallet"            // user has no Sigilo-compatible wallet
  | "assurance_unmet"      // user's credential cannot meet the requested tier
  | "invalid_config"       // publishable key, predicate, or tier invalid
  | "network_error"        // transport failure
  | "rate_limited"         // too many requests from this RP
  | "server_error";        // network-side fault

/**
 * Strongly-typed error subclass thrown by the SDK.
 */
export class SigiloError extends Error {
  public readonly code: SigiloErrorCode;
  public readonly state: VerificationState;

  constructor(code: SigiloErrorCode, message: string, state: VerificationState) {
    super(message);
    this.name = "SigiloError";
    this.code = code;
    this.state = state;
  }
}
