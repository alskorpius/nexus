# Releasing Nexus

Releases are built by GitHub Actions (`.github/workflows/release.yml`) on every `v*` tag push. The workflow builds installers for Windows (MSI + NSIS), macOS (Apple Silicon + Intel DMG/app), and Linux (deb, rpm, AppImage), then attaches them to a **draft** GitHub Release.

## Release flow

```bash
# 1. Bump the version everywhere (package.json, package-lock.json,
#    tauri.conf.json, Cargo.toml, Cargo.lock — kept in sync by the script)
npm run bump 0.2.0

# 2. Commit and tag
git add -A
git commit -m "Release v0.2.0"
git tag v0.2.0

# 3. Push — the tag triggers the release workflow
git push origin main v0.2.0
```

Then:

1. Watch the run at <https://github.com/alskorpius/nexus/actions> (4 matrix jobs; first run takes ~15–25 min without warm Rust caches).
2. When all jobs are green, a **draft release** appears under Releases with all installers attached.
3. Review the draft (assets present, release notes), edit the body if needed, and click **Publish release**.

## Version consistency

The version lives in three manifests (`package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`) plus two lockfiles. The `check-version` job fails the workflow if the tag (`v0.2.0`) does not match all three manifests (`0.2.0`) — always bump via `npm run bump`, never by hand.

## If a release build fails

- Fix the issue on `main`, then move the tag and re-push:

  ```bash
  git tag -f v0.2.0
  git push origin v0.2.0 --force
  ```

  (Force-pushing a tag is safe while the release is still a draft.)
- Or delete the tag and draft release and start over.

## Known limitations / future work

- **Unsigned binaries**: Windows SmartScreen and macOS Gatekeeper warn on first run. The release body includes user instructions. Code signing is planned: SignPath Foundation first (free for OSS, requires CI-built artifacts — which this workflow provides), fallback Azure Trusted Signing or Certum. macOS notarization requires an Apple Developer account ($99/yr).
- **No auto-update yet**: `tauri-plugin-updater` will need an updater key pair and `createUpdaterArtifacts: true` in `tauri.conf.json`, plus a `latest.json` endpoint (tauri-action can generate it).
- **Rust cache**: the workflow only runs on tags, so `swatinem/rust-cache` rarely has a warm cache to restore. If release builds feel slow, add a plain CI workflow on `main` pushes so the cache stays warm.
