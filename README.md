<div align="center">

# @sigilo/verify

**Privacy-preserving age verification. Relying-party SDK.**

[![npm](https://img.shields.io/npm/v/@sigilo/verify.svg)](https://www.npmjs.com/package/@sigilo/verify)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange.svg)](#release-status)

</div>

---

> **`sigilo`** *(n., Sp./Pt.)* — secrecy; discretion; the practice of keeping a matter unspoken. From Latin *sigillum*, "a small seal."

Sigilo is a privacy-preserving age verification network. It lets your users prove they meet an age threshold (over 13, 16, 18, 21, 25) without revealing their identity, date of birth, document, or any correlatable identifier — to you, to Sigilo, or to anyone else.

This package is the **relying-party SDK**. Drop it into your website to age-gate a flow. A second module, `@sigilo/verify/server`, performs the server-side verification that must back every client-side check.

## Release status

> ⚠️ **This is the v0.0.1 namespace-reservation release.** The API surface below is stable and reflects the intended production shape, but the network and cryptographic operations are stubbed: every call to `verify()` throws `SigiloError("server_error")` with a pointer to our status page.
>
> Real cryptography (BBS+ proofs over W3C Verifiable Credentials, via audited libraries) ships in v0.2. The first production-ready release will be versioned **>=1.0** and will follow an independent security audit by Trail of Bits, NCC Group, or Cure53.
>
> **Do not use this package in production until v1.0.** Track release progress at [sigilo.id/status](https://sigilo.id/status).

## Install

```sh
npm install @sigilo/verify
```

## Browser usage

```ts
import { Sigilo, SigiloError } from "@sigilo/verify";

const sigilo = new Sigilo({
  publishableKey: "pk_live_...",  // from your Sigilo dashboard
  predicate: "over_18",
  assurance: "high",              // "estimation" | "standard" | "high"
});

try {
  const result = await sigilo.verify();
  if (result.verified) {
    // POST result.presentation to your server for verification.
    // Do not trust this client-side result as authoritative.
    await fetch("/api/age-check", {
      method: "POST",
      body: JSON.stringify({ presentation: result.presentation }),
    });
  }
} catch (e) {
  if (e instanceof SigiloError) {
    switch (e.code) {
      case "user_denied":
        // show a friendly "couldn't verify your age" message
        break;
      case "no_wallet":
        // walk the user through wallet setup
        break;
      default:
        // log e.code; never expose it to the user
    }
  }
}
```

## Server usage

```ts
import { verifyPresentation, SigiloError } from "@sigilo/verify/server";

app.post("/api/age-check", async (req, res) => {
  try {
    const verified = await verifyPresentation(process.env.SIGILO_SECRET!, {
      presentation: req.body.presentation,
      expectedPredicate: "over_18",
      minAssurance: "high",
      expectedNonce: req.session.verificationNonce,
    });
    // Trust ONLY this server-side result.
    // verified.predicate is "over_18"; verified.assurance >= "high".
    req.session.ageVerified = true;
    res.json({ ok: true });
  } catch (e) {
    res.status(403).json({ ok: false });
  }
});
```

## What you receive — and what you don't

When `verify()` succeeds, you receive:

| Field | Example | What it tells you |
|---|---|---|
| `verified` | `true` | The proof was valid |
| `predicate` | `"over_18"` | What was proven (echoes your request) |
| `assurance` | `"high"` | The actual tier delivered (≥ requested) |
| `proofId` | `"proof_4kZ..."` | Opaque audit identifier |
| `nonce` | `"n_..."` | Replay-protection nonce (verify server-side) |
| `presentation` | `"eyJ..."` | The cryptographic proof for server-side verification |

You do **not** receive: the user's name, date of birth, document number, biometric, issuer identity, or any cross-site identifier. Two verifications by the same user — at your site or at any other site in the network — produce presentations that are cryptographically unlinkable.

## API reference

### `class Sigilo`

```ts
new Sigilo(config: SigiloConfig)
```

**Methods**
- `verify(): Promise<VerificationResult>` — initiate a verification. Throws `SigiloError` on any failure.
- `cancel(): void` — cancel any in-flight verification. Idempotent.
- `get state(): VerificationState` — the current lifecycle state.

### `verifyPresentation(secretKey, options)`

```ts
import { verifyPresentation } from "@sigilo/verify/server";

verifyPresentation(secretKey: string, options: VerifyPresentationOptions): Promise<VerifiedPresentation>
```

Required server-side. Never trust the client SDK's `verified: true` alone.

### `class SigiloError extends Error`

All thrown errors are instances. Inspect `.code` for stable machine-readable error identification.

| Code | Meaning |
|---|---|
| `user_denied` | User explicitly denied the request |
| `user_canceled` | User closed their wallet without responding |
| `timeout` | Wallet did not respond within the protocol window |
| `no_wallet` | User has no Sigilo-compatible wallet |
| `assurance_unmet` | User's credential cannot meet the requested tier |
| `invalid_config` | Publishable/secret key, predicate, or tier invalid |
| `network_error` | Transport failure |
| `rate_limited` | Too many requests from this RP |
| `server_error` | Network-side fault |

## Security

Found a security issue? Please **do not** open a public GitHub issue. Email [security@sigilo.id](mailto:security@sigilo.id). PGP key fingerprint and disclosure policy at [sigilo.id/security](https://sigilo.id/security).

See [SECURITY.md](SECURITY.md) for our disclosure policy and [THREAT_MODEL.md](THREAT_MODEL.md) for the network's threat model.

## Standards

Sigilo builds on:

- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model-2.0/)
- [OpenID for Verifiable Presentations (OpenID4VP)](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [BBS+ Signatures](https://w3c.github.io/vc-di-bbs/)
- [ISO/IEC 18013-5 (mobile driving licence)](https://www.iso.org/standard/69084.html)
- [eIDAS 2.0 / EUDI Wallet ARF](https://github.com/eu-digital-identity-wallet)

We do not invent cryptography. We integrate audited implementations and provide the network layer, issuer trust framework, and developer experience above them.

## License

[Apache 2.0](LICENSE)

---

Built with [`sigilo`](https://sigilo.id) — *proof, in confidence.*
