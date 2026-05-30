/**
 * Sigilo — minimal client + server example
 *
 * This file demonstrates the canonical integration pattern. It is illustrative,
 * not runnable as-is: split it across your browser and server.
 *
 * 1. BROWSER: the user clicks "Verify with Sigilo" on your site
 * 2. SERVER:  your server generates a fresh nonce and stores it in the session
 * 3. BROWSER: the SDK uses the nonce to request a proof from the wallet
 * 4. BROWSER: the SDK returns a presentation; the browser POSTs it to your server
 * 5. SERVER:  your server verifies the presentation server-side — the security boundary
 * 6. SERVER:  if verified, your server grants access
 */

// ─── BROWSER SIDE ──────────────────────────────────────────────────────────

import { Sigilo, SigiloError } from "@sigilo/verify";

async function ageGateBrowser(): Promise<void> {
  // Step 1: ask the server for a fresh verification nonce.
  const { nonce } = await fetch("/api/age-check/start", { method: "POST" })
    .then((r) => r.json());

  // Step 2: initiate verification with the SDK.
  const sigilo = new Sigilo({
    publishableKey: "pk_live_4kZmVAcJ8K3xC2",  // your publishable key
    predicate: "over_18",
    assurance: "high",
    onStateChange: (state) => {
      // optional: dim the page while the wallet is open
      document.body.dataset.sigiloState = state;
    },
  });

  try {
    const result = await sigilo.verify();

    // Step 3: POST the presentation to your server for the trustworthy check.
    const response = await fetch("/api/age-check/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        presentation: result.presentation,
        nonce, // server checks this matches what it issued
      }),
    });

    if (response.ok) {
      window.location.assign("/dashboard"); // they're in
    } else {
      throw new Error("Server rejected the presentation");
    }
  } catch (e) {
    if (e instanceof SigiloError) {
      switch (e.code) {
        case "user_denied":
          // User chose not to verify. Show a respectful UI; do not retry.
          showMessage("We can't grant access without age verification.");
          break;
        case "no_wallet":
          // User has no Sigilo-compatible wallet yet. Offer a walkthrough.
          showWalletSetup();
          break;
        case "assurance_unmet":
          // Their credential is fine but not strong enough for this gate.
          // Suggest upgrading via a Tier 1 issuer.
          showMessage("This area requires a higher-assurance credential.");
          break;
        default:
          // Network or server error. Safe to retry.
          showMessage("Something went wrong. Please try again.");
      }
    }
  }
}

declare function showMessage(message: string): void;
declare function showWalletSetup(): void;


// ─── SERVER SIDE ────────────────────────────────────────────────────────────

import { verifyPresentation } from "@sigilo/verify/server";
import { randomBytes } from "node:crypto";
import type { Request, Response } from "express";

// In-memory session for the example. In production, use your real session store.
declare const session: {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
};

/**
 * POST /api/age-check/start
 *
 * Issue a fresh nonce and store it in the user's session. The nonce binds a
 * later presentation to this specific session and prevents replay.
 */
export function startAgeCheck(_req: Request, res: Response): void {
  const nonce = randomBytes(32).toString("base64url");
  session.set("ageCheckNonce", nonce);
  res.json({ nonce });
}

/**
 * POST /api/age-check/complete
 *
 * Verify the presentation cryptographically. ONLY this server-side check is
 * authoritative — never grant access based on the browser SDK's result alone.
 */
export async function completeAgeCheck(
  req: Request,
  res: Response,
): Promise<void> {
  const expectedNonce = session.get("ageCheckNonce");
  if (!expectedNonce) {
    res.status(400).json({ error: "no_active_check" });
    return;
  }

  try {
    const verified = await verifyPresentation(
      process.env.SIGILO_SECRET!,  // sk_live_... from your secret manager
      {
        presentation: req.body.presentation,
        expectedPredicate: "over_18",
        minAssurance: "high",
        expectedNonce,
        maxAgeMs: 5 * 60 * 1000, // 5 minutes
      },
    );

    // Verified! Store a durable record of the age check.
    // - verified.predicate is "over_18"
    // - verified.assurance >= "high"
    // - verified.proofId is the audit-trail identifier
    session.set("ageVerified", "true");
    session.set("ageVerifiedProofId", verified.proofId);
    session.delete("ageCheckNonce");

    res.json({ ok: true });
  } catch (e) {
    // Log the error code for analytics; never expose it to the user.
    res.status(403).json({ ok: false });
  }
}
