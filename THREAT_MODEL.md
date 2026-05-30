# Threat model

This document summarises the threat model for the Sigilo network and the `@sigilo/verify` SDK. The full threat model is published at [sigilo.id/threat-model](https://sigilo.id/threat-model) and is updated with every major release and independent audit.

## In scope

- The `@sigilo/verify` browser SDK
- The `@sigilo/verify/server` verifier
- The Sigilo wallet and its on-device key handling
- The presentation protocol between wallet and relying party
- The issuer-to-wallet credential issuance protocol
- The Sigilo network's role as accreditor and key publisher

## Out of scope (handled by other layers)

- The cryptographic security of BBS+ itself (handled by upstream audited libraries)
- Operating system security on the user's device (Apple, Google)
- The relying party's own application security
- Issuer implementations (assessed under the Sigilo trust framework)

## Adversaries we design against

### A1 — Curious relying party

**Goal:** re-identify users across sessions; build cross-site profiles.

**Mitigations:**
- Each presentation uses a fresh randomised BBS+ proof. Two presentations by the same user, to the same site, on the same day, are cryptographically unlinkable.
- The relying party receives only the requested predicate result and a per-request opaque proof ID. No user identifier, no issuer identifier.

### A2 — Malicious relying party

**Goal:** collect and resell user data.

**Mitigations:**
- Architecturally there is nothing to resell. The RP never receives PII.
- RP onboarding includes contractual data-handling commitments and is subject to revocation under the trust framework.

### A3 — Compromised Sigilo

**Goal:** build a profile of who visits where.

**Mitigations:**
- Sigilo is not in the presentation data path. Proofs flow directly between wallet and RP and are verified using public network keys.
- Sigilo holds no log of which user verified at which site at which time. We cannot answer the question even when asked.

### A4 — State-level coercion of an issuer

**Goal:** force the issuer to identify a specific verification.

**Mitigations:**
- The issuer signs credentials at onboarding but is not on the presentation data path.
- BBS+ unlinkability means the issuer cannot, by inspecting a presented proof, identify which credential it derives from — without breaking the cryptographic assumption.
- Multi-issuer federation: relying parties accept any accredited issuer, so no single issuer is a chokepoint.

### A5 — Determined minor using an adult's device

**Goal:** defeat the age check using a parent's verified wallet.

**Mitigations:**
- Hardware-bound keys: presentations require on-device biometric unlock at the moment of presentation.
- Passive liveness for the `high` assurance tier.
- Behavioural device-binding signals processed locally; anomalies trigger re-authentication.
- Periodic re-anchoring against the original issuer.
- **Not foolproof.** This adversary is the hardest case for any age verification system. Sigilo raises the bar substantially above current solutions while remaining honest about residual risk.

### A6 — Synthetic identity at onboarding

**Goal:** create a fraudulent credential.

**Mitigations:**
- Tier 1 issuers use NFC chip reads cryptographically signed by issuing governments — not vulnerable to deepfake at the document level.
- Tier 2 issuers (banks, MNOs) leverage their existing KYC processes.
- Tier 3 (estimation-only) is clearly labelled and only available to RPs whose regulator accepts that tier.

## What we promise

We will:

- Publish this threat model in full and keep it current
- Subject every release to independent audit
- Disclose all findings, including those we did not initially mitigate
- Sunset the company before adding tracking capabilities under coercion

## What we cannot promise

We cannot promise:

- That a determined adult who hands their unlocked device to a minor will be stopped
- That a regulator will accept our approach in every jurisdiction
- That novel cryptographic attacks on BBS+ won't emerge (we monitor and will rotate proof schemes if needed)

## Reporting

Suspect a threat we haven't modelled? Email [security@sigilo.id](mailto:security@sigilo.id). See [SECURITY.md](SECURITY.md).
