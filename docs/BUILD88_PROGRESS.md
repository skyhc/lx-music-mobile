# Build88 migration progress — not a release

Target repository: `skyhc/lx-music-mobile`, branch `master`.
Baseline: `f940d6eadd1574d091d85e6c940985f5acb22df1`.

## Current committed increment

The dark bottom playback bar now uses the theme's main page background; light themes retain the original content background. The production helper and PlayerBar render path are covered by `scripts/check-player-bar-theme.js`. A separate read-only unit workflow runs it without removing or changing the existing full iOS workflow. Player controls, keyboard visibility, complete-player queue, README, signing identity and release assets are unchanged.

GitHub code write was actually verified through `create_blob` and a matching `fetch_blob` read-back. The repository reports push/admin access. Do not attribute a previous tool-discovery limitation to missing user permission or ask the user to repeatedly authorize the same connection.

## Whole-request status

This is an intermediate application-code commit, not completion of the migration. Package version remains 1.9.0 / 87; do not publish it over Build87 or claim that its build means Build88 is complete.

The previously generated `LX-Music-Build88-WIP-Checkpoint.zip` contains 26 locally checked files, but only the dark-bar production changes in this increment have been put on this branch. The other checkpoint changes still require replay and commit. Its local UI, Swift protocol and publication tests are not native iOS acceptance results.

Remaining scope:
- In My Lists only, replace top-scroll with stable-ID current-song location; leave the player's internal playlist unchanged.
- Integrate CD/square cover selection and native state/animation/Reduce Motion regression.
- Register and bridge WebDAV in the actual app; add account storage, UI, music-list import, playback, optional caching and traffic controls.
- Add playlist and complete application-data backup/restore, integrity validation and rollback, with protected credentials.
- Add default-disabled downloads, queue management/recovery and WebDAV destination support.
- Implement future Release body/asset restriction: changelog and system requirements only; IPA, xcarchive ZIP and at most one checksum text; never publish logs, screenshots or extra reports as Release assets.

Preserve all existing native playback, cache/offline, themes, shortcuts, synchronization, full-history regression and 54 screenshot gates. Validate all remaining features against the original requirements twice. The final completion condition remains an actual Xcode build, matching IPA/archive SHA/CRC/source/version checks and a new verified Release. Simulator validation is not physical-device validation. Keep unsigned labelling and existing signing identity. Do not disable the tracking task just because this intermediate build succeeds.
