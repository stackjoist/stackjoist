---
name: release-prep
description: Prepare a package release locally - version, changelog, full verification, npm pack inspection and a clean-install test. Never publishes. Run only when the user asks to prepare a release.
disable-model-invocation: true
---

# Release preparation

This skill prepares and verifies. Publishing, tagging, pushing and creating releases are separate actions that need explicit user approval each time.

## Steps

1. Confirm the working tree is clean or that the user accepts the listed changes. Confirm the target version with the user (semantic versioning: breaking → major, features → minor, fixes → patch; `0.x` may break on minor).
2. Update `CHANGELOG.md` with user-facing changes, grouped as Added / Changed / Fixed / Security, and any migration notes.
3. Run the full verification sequence (`verify-and-handoff`), including build.
4. Run `npm pack --dry-run` (or create the tarball in a temporary folder) and inspect the file list: build output, required assets, README and LICENSE present; no source maps you did not intend, tests, `.env` files, credentials or local artifacts.
5. Install the tarball in a clean temporary project and run the documented commands or imports from there.
6. Check `package.json`: `name`, `version`, `bin` paths, `files`, `exports`, `engines`, `license`, `repository`.
7. Report the exact commands the user would run to publish, and state clearly that nothing has been published.

## Never

- `npm publish`, `git push`, `git tag` pushes or GitHub releases without explicit approval for that specific action.
- Use long-lived tokens in files; prefer trusted publishing from CI where available.

## Done when

The release checklist results are reported with evidence and the user has everything needed to decide.
