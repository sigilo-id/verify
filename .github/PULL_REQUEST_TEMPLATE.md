<!--
Thanks for contributing to @sigilo/verify. Before you open this PR, please
read CONTRIBUTING.md and make sure the boxes below are checked or honestly
unchecked. Honest "no" answers are fine; misleading checked boxes are not.
-->

## What this PR changes

<!-- A one-paragraph description of the change. Why, not how — the diff
shows how. Reviewers should be able to read this and the diff together
and understand both. -->

## Type of change

<!-- Tick all that apply -->
- [ ] Bug fix (no API change)
- [ ] New feature (no breaking API change)
- [ ] Breaking change (requires a major version bump)
- [ ] Documentation only
- [ ] Refactor / internal cleanup
- [ ] Build, CI, or release infrastructure
- [ ] Security fix (see Security note below)

## Checklist

- [ ] Tests added or updated for any behaviour change
- [ ] `npm run typecheck` passes locally
- [ ] `npm test` passes locally
- [ ] `npm run build` produces a clean dist/
- [ ] CHANGELOG.md updated under `[Unreleased]`
- [ ] Public API changes reflected in the README
- [ ] No new runtime dependencies added without prior discussion

## Cryptographic or protocol changes

<!-- If this PR touches anything in src/server.ts, src/types.ts, the
trust framework, or the proof presentation flow, fill this section.
Otherwise delete it. -->

- [ ] The cryptographer (@username) has been requested as a reviewer
- [ ] Changes are consistent with the published THREAT_MODEL.md
- [ ] Any new failure modes are documented in error codes and tests

## Security note

<!-- If this PR fixes a vulnerability, do NOT describe the vulnerability
in this PR description until a fix is released. Open a private security
advisory instead: github.com/sigilo-id/verify/security/advisories/new -->
