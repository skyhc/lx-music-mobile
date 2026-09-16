# Build88 migration progress — not a release

Target repository: `skyhc/lx-music-mobile`, branch `master`.
Baseline: `f940d6eadd1574d091d85e6c940985f5acb22df1`.

## Committed application increments

The dark bottom playback bar now uses the theme's main page background; light themes retain the original content background. The production helper and PlayerBar render path are covered by `scripts/check-player-bar-theme.js`. A separate read-only unit workflow runs it without removing or changing the existing full iOS workflow. Player controls, keyboard visibility, complete-player queue, README, signing identity and release assets are unchanged.

`4a1655406017a2bdd525569947c3cb437e6fa3f1` adds stable-ID current-song location to My Lists, including async list switching and stale-request cancellation. The full-player playlist implementation remains unchanged.

## Repair of Actions #92 prerequisite failure

Run `35128869140` reached Xcode selection and dependency installation, then failed before CocoaPods/native compilation at `scripts/check-build81-regressions.js:82`. That assertion still required the intentionally replaced `回到顶部` source text. A repository-wide scan found the same obsolete contract in Build82. Both original scripts fail on the exact #92 source archive; neither failure is a native compiler or signing error.

Both checks now execute the production ActiveList render/callback path instead of looking for the old text. The existing compact-selector/no-duplicate-header and sidebar-title contracts are retained. The new `scripts/check-mylist-location.js` additionally executes the actual toolbar, parent event wiring, List handlers and stable-ID resolver with deterministic storage/platform adapters. Its seven groups cover independent locate/search buttons, layout/visibility, wrong queue index, repeated clicks, cross-list loads, obsolete async results, cleanup, missing songs and read failures. No application source or player queue file is changed by this repair.

Pre-submit verification on the exact #92 archive plus this patch:
- Both stale assertions reproduced as failures before editing; all 14 Build81 and 15 Build82 groups pass afterward.
- Seventeen local regression scripts pass, including the new seven-group production-path suite and 579-file syntax scan; direct full-project TypeScript exits zero.
- Four deliberately broken source variants (old sidebar label, miswired compact callback, disconnected parent event and wrong song index) are rejected by the new suite. Mutation tests use an external read adapter; no production source is modified.
- Existing workflow steps/commands and native/screenshot/archive gates remain; the full iOS workflow gains one test command, and the incremental workflow gains the affected regression scripts and triggers.

The local source archive has no historical Git objects. Full-history settings/upstream/TypeScript comparisons must still run unchanged in Actions. Local tests are not Xcode or physical-device acceptance. The new CI outcome is pending at this commit; do not report the repair as a successful native build before reading that outcome.

GitHub code write was actually verified through `create_blob` and a matching `fetch_blob` read-back. The repository reports push/admin access. Do not attribute a previous tool-discovery limitation to missing user permission or ask the user to repeatedly authorize the same connection.

## Whole-request status

This is an intermediate application-code commit, not completion of the migration. Package version remains 1.9.0 / 87; do not publish it over Build87 or claim that its build means Build88 is complete.

The previously generated `LX-Music-Build88-WIP-Checkpoint.zip` contains 26 locally checked files, and the dark-bar and My Lists location production changes have been put on this branch. Other checkpoint changes still require replay and commit. Its local UI, Swift protocol and publication tests are not native iOS acceptance results.

Remaining scope:
- Complete native/runtime acceptance of the committed My Lists location changes; leave the player's internal playlist unchanged.
- Integrate CD/square cover selection and native state/animation/Reduce Motion regression.
- Register and bridge WebDAV in the actual app; add account storage, UI, music-list import, playback, optional caching and traffic controls.
- Add playlist and complete application-data backup/restore, integrity validation and rollback, with protected credentials.
- Add default-disabled downloads, queue management/recovery and WebDAV destination support.
- Implement future Release body/asset restriction: changelog and system requirements only; IPA, xcarchive ZIP and at most one checksum text; never publish logs, screenshots or extra reports as Release assets.

Preserve all existing native playback, cache/offline, themes, shortcuts, synchronization, full-history regression and 54 screenshot gates. Validate all remaining features against the original requirements twice. The final completion condition remains an actual Xcode build, matching IPA/archive SHA/CRC/source/version checks and a new verified Release. Simulator validation is not physical-device validation. Keep unsigned labelling and existing signing identity. Do not disable the tracking task just because this intermediate build succeeds.
