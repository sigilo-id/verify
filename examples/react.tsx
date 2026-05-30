/**
 * Sigilo — React integration example
 *
 * A self-contained React component that age-gates the rest of the app.
 * Drop this anywhere in your tree. Uses React 18+; no other dependencies.
 *
 * For a full client + server pattern see ./client-server.ts.
 */

import { useCallback, useEffect, useState } from "react";
import { Sigilo, SigiloError } from "@sigilo/verify";
import type { VerificationState } from "@sigilo/verify";

interface AgeGateProps {
  publishableKey: string;
  predicate: "over_18" | "over_21";
  onVerified: (presentation: string) => Promise<void>;
  children: React.ReactNode;
}

export function AgeGate({
  publishableKey,
  predicate,
  onVerified,
  children,
}: AgeGateProps): JSX.Element {
  const [verified, setVerified] = useState(false);
  const [state, setState] = useState<VerificationState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sigilo, setSigilo] = useState<Sigilo | null>(null);

  useEffect(() => {
    const client = new Sigilo({
      publishableKey,
      predicate,
      assurance: "high",
      onStateChange: setState,
    });
    setSigilo(client);
    return () => client.cancel();
  }, [publishableKey, predicate]);

  const handleVerify = useCallback(async () => {
    if (!sigilo) return;
    setError(null);
    try {
      const result = await sigilo.verify();
      await onVerified(result.presentation);
      setVerified(true);
    } catch (e) {
      if (e instanceof SigiloError) {
        setError(messageForCode(e.code));
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  }, [sigilo, onVerified]);

  if (verified) return <>{children}</>;

  return (
    <div className="age-gate">
      <h2>Age verification required</h2>
      <p>One tap. No ID upload. No data shared with us beyond a yes/no answer.</p>

      <button
        onClick={handleVerify}
        disabled={state !== "idle" && state !== "denied" && state !== "failed"}
      >
        {labelForState(state)}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
  );
}

function messageForCode(code: string): string {
  switch (code) {
    case "user_denied":
      return "We can't grant access without age verification.";
    case "no_wallet":
      return "You'll need a Sigilo-compatible wallet to continue.";
    case "assurance_unmet":
      return "This area requires a higher-assurance credential.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function labelForState(state: VerificationState): string {
  switch (state) {
    case "idle":
    case "denied":
    case "failed":
      return "Verify with Sigilo";
    case "requesting":
      return "Preparing…";
    case "awaiting_wallet":
      return "Check your wallet";
    case "presenting":
      return "Verifying…";
    case "verified":
      return "Verified";
  }
}
