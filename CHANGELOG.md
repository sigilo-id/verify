# Changelog

All notable changes to `@sigilo/verify` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for v0.2
- Real BBS+ proof presentation against Sigilo network keys
- OpenID4VP transport implementation
- Wallet discovery via browser-native verifiable credentials API
- Server-side `verifyPresentation()` cryptographic verification
- Integration with audited libraries (Google ZKAccess, iden3, EUDI reference impl)

### Planned for v1.0
- Independent security audit (Trail of Bits, NCC Group, or Cure53)
- Production-ready release after design partner validation
- Stable API contract with backward-compatibility guarantees from this version forward

## [0.0.2] — 2026-05-30

### Changed
- Publishing now happens via GitHub Actions with cryptographic provenance attestation. Every release from this version forward includes a verified trust chain visible on npmjs.com — linking the published artifact to the exact GitHub commit and workflow run that built it.
- Repository configuration added: CI matrix testing on Node 18 and 20, CodeQL security scanning, Dependabot for dependency updates, CODEOWNERS for review enforcement.

### Notes
- No code changes from v0.0.1. The package behaviour is identical; the difference is in the publish chain.

## [0.0.1] — 2026-05-26

### Added
- Initial namespace-reservation release
- Public type definitions for the SDK API surface (`SigiloConfig`, `VerificationResult`, `VerificationError`, `Predicate`, `AssuranceTier`)
- `Sigilo` client class with configuration validation and lifecycle states
- `verifyPresentation()` server-side stub with full options validation
- `SigiloError` class with stable error codes
- Comprehensive test suite (21 tests) covering configuration validation, lifecycle, and stub behaviour
- Documentation: README, SECURITY.md, this CHANGELOG

### Notes
- Network and cryptographic operations are deliberately stubbed; all `verify()` and `verifyPresentation()` calls throw `SigiloError` with code `server_error`
- This release reserves the `@sigilo/verify` npm namespace and demonstrates the intended API shape
- Published from a local machine without provenance attestation; v0.0.2 onwards is published via GitHub Actions with provenance
- **Do not use in production until v1.0**
