# Contributing to @sigilo/verify

Thanks for considering a contribution. This document covers what we accept, how to work with the codebase, and where the bar sits for changes to a security-positioned package.

## Before you start

Three categories of contribution are equally welcome:

1. **Bug reports** — file via the issue template
2. **Documentation improvements** — open a PR directly, no issue needed
3. **Code changes** — for anything non-trivial, **please open an issue first** to discuss the approach before writing code

For security vulnerabilities, do **not** open a public issue. See [SECURITY.md](../SECURITY.md).

## What we accept

We're happy to take:

- Bug fixes with a clear reproduction
- Documentation fixes, clarifications, and additions
- Tests that improve coverage of existing behaviour
- TypeScript type improvements that don't change runtime behaviour
- Build, CI, and developer-experience improvements
- New examples in `examples/`

We will be careful with (and likely want discussion first on):

- New runtime dependencies — this package currently has zero, and we want to keep it that way unless a new dependency is essential
- API surface changes — even additive ones, because every API is a forever-promise
- Changes to error codes, error messages, or thrown error types — these are part of the public contract
- Anything in `src/server.ts` or related to proof presentation/verification — the cryptographic boundary requires extra scrutiny

We will not accept:

- Cryptographic primitives written from scratch
- "Vibes-based" changes without tests
- PRs that disable existing tests to make a change pass
- Anything that adds telemetry, tracking, or per-user identifiers to the network protocol

## Development setup

```sh
# Clone
git clone git@github.com:sigilo-id/verify.git
cd verify

# Install
npm install

# Develop loop
npm run typecheck     # type check only
npm test              # run all tests
npm run build         # build production output
npm run prepublishOnly # the full publish gate
```

You need Node.js 18 or higher. Node 20 LTS is recommended.

## Coding standards

- **TypeScript strict mode is on.** All compiler strictness flags are enabled. No `any`. No `@ts-ignore` — use `@ts-expect-error` with an explanation if you genuinely need to bypass a check.
- **Tests are mandatory for behaviour changes.** New code paths need new tests. We use Node's built-in `node:test` runner — no external test framework.
- **No dependencies without discussion.** We have zero runtime dependencies. Adding one needs a clear case in the issue thread.
- **Comments explain why, not what.** The code shows what. Comments are for context the code can't carry.
- **Public API needs JSDoc.** Every exported type and function has a docblock. Internal helpers may use shorter comments.

## Commit style

We use Conventional Commits, loosely:

```
type(scope): short summary

Longer body if needed. Wrap at 72 characters.
Reference issues with "Closes #123" or "Refs #123".
```

Common types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, `deps`.

Examples:
- `feat(client): add over_21 predicate`
- `fix(server): reject expired presentations more strictly`
- `docs: clarify nonce generation requirements`
- `chore(release): v0.0.2`

## Pull request workflow

1. Open an issue for discussion (unless it's a small fix or docs change)
2. Fork the repo, create a branch from `main`
3. Make your changes, with tests
4. Run `npm run prepublishOnly` locally — this is the same gate CI runs
5. Open the PR using the template
6. CI must pass; CODEOWNERS-assigned reviewers must approve
7. Once approved, we'll squash-merge

We prefer small, focused PRs over large ones. If you're working on something big, break it into a series.

## Release process

Maintainers only:

1. Land all changes for the release on `main`
2. Bump the version in `package.json` (follow [semver](https://semver.org/))
3. Update CHANGELOG.md — move items from `[Unreleased]` to the new version section
4. Commit: `chore(release): vX.Y.Z`
5. Tag: `git tag vX.Y.Z && git push --tags`
6. Create a GitHub Release for the tag — this triggers the publish workflow
7. The publish workflow runs the full prepublish gate, then `npm publish --access public --provenance`
8. Verify the new version appears on npmjs.com with the green provenance badge

## Code of conduct

Be kind. Assume good faith. Disagree on the substance, not the person. We don't have a long code of conduct because we shouldn't need one — but if a moderation decision is ever needed, the maintainers will make it and explain why.
