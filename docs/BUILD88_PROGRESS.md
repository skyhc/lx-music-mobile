# Build88 migration progress — not a release

Target repository: `skyhc/lx-music-mobile`, branch `master`.
Original Build88 replay baseline: `f940d6eadd1574d091d85e6c940985f5acb22df1`.

## Verified baseline before this increment

`c38dc3e2b716611cc1203c48af7ff62a6015992f` is the pre-increment `master` HEAD. Its full iOS workflow #93 / run `35131066440` and incremental run `35131066421` both completed successfully. The full run retained the historical TypeScript/settings/upstream checks, CocoaPods, simulator build, native online/offline playback, system-theme/restart checks, 54 screenshot gate, device Xcode archive and IPA/archive packaging. This evidence is simulator/CI evidence, not physical-device acceptance.

That successful build is still package `1.9.0 / 87`, is unsigned, and is an intermediate repair build. It is not Build88 and must not replace the existing Build87 Release.

The committed application changes already on `master` before this increment are the dark-theme bottom playback bar and stable-ID current-song location in My Lists. The full-player playlist remains out of scope and is protected by the existing queue regression gate.

## Current cover-style increment

This increment integrates the selectable Any Listen-inspired cover behaviour into the real React Native playback detail path without embedding Any Listen Svelte components or artwork:

- `playDetail.coverStyle` supports `square` and `cd`; the default remains `square`.
- Portrait and landscape playback detail both render through the shared `PlayerCover` production component.
- CD rotation uses the native animation driver and preserves phase across pause/resume.
- Rotation is gated by playback state, foreground state, playback-detail visibility, the active portrait page, and iOS Reduce Motion.
- A Player setting exposes `CD` and `正方形` selection.
- `scripts/check-build88-cover.js` executes the production rotation helper, compiles the production component/layout/settings sources, and checks the lifecycle/accessibility wiring. The existing full-project TypeScript, player-queue, native playback, theme, sync, history and 54-screenshot gates remain in the full workflow.

Local replay cross-check before submission confirms the selected cover production files are byte-identical to their verified checkpoint postimages, while their c38 preimages match the checkpoint preimages. The concise cover regression also passes locally. Xcode/native runtime acceptance for this new increment remains pending until the Actions run for its commit finishes; the current 54-shot suite does not by itself prove the CD visual state on a physical device.

## Sync failure investigation after Actions #94

Full iOS run `35142370694` (#94, source `e5ff8b0ee28af5a43356735374a1ab8c508c5475`) passed the pre-build checks and simulator compilation, but failed the first native unpaired-authentication expectation. Its old assertion collapsed any unexpected error into `unpaired client did not report missing code`. It did not preserve the actual error, and the server fixture only logged WebSocket connections, so those artifacts do not establish the underlying cause. Archive/IPA steps were skipped. The independent cover increment run passed; this does not prove all native checks passed.

This increment repairs that diagnostic loss without claiming the underlying native/network failure fixed:

- Both missing-code and wrong-code checks require the exact expected rejected error, record it on success, and preserve a redacted actual error/stage/status on failure. Resolved cancellation and unrelated errors still fail.
- The CI fixture's health now verifies its actual `/hello` and `/id` protocol endpoints rather than returning success from an unrelated control port alone.
- A bounded passive observer records only endpoint, HTTP status and timing. It does not capture headers, query strings, bodies, identifiers or keys. The driver saves it independently, including when native setup fails.
- Ten executable diagnostics checks cover strict rejection, cause preservation, redaction, protocol readiness and a real local HTTP observer. These join both CI workflows without deleting existing gates or raising timeouts.

The production sync protocol, credentials, app sources other than simulator-only tests, playback queue, signing identity, package 1.9.0/87 and published Build87 are unchanged. A new full Actions run is required to observe the real native result; no new native or binary success is predeclared.

## Checkpoint material retained for later increments

`LX-Music-Build88-WIP-Checkpoint.zip` was re-read from the supplied file reference and its SHA256 was rechecked as `4eea0969e08ef4ab23f8b8f4a8fca903595a164d694ecfceab499ce8c814715d`. Its WebDAV Foundation core and future publication-policy work remain useful replay material, but they are not treated as completed App features.

Remaining scope after the cover increment:

- Register and bridge WebDAV in the actual app; add account storage, directory browsing, music-list import, actual playback and controllable caching/traffic behaviour.
- Add playlist backup plus complete persistent application-data backup/restore, with protected credentials, format/version and integrity validation, and failure rollback. Playlist JSON alone is not complete-data backup.
- Add the default-disabled LX Desktop-style download queue, including real App download execution, pause/retry/restart recovery, local destination and WebDAV destination. HTTP upload protocol tests are not App download acceptance.
- Harden the future Release publisher so the body contains only update notes and system requirements and public assets are only IPA, xcarchive ZIP and at most one checksum text. Logs, screenshots, build metadata and reports stay in Actions.
- Add targeted native/integration acceptance for each remaining production path and complete two requirement cross-checks before publication.

## Completion boundary

Do not report the whole Build88 request complete until all remaining features are connected to production paths, corresponding source/Xcode checks succeed, the package is advanced to the intended new build, IPA/archive source/version/identity/CRC/SHA consistency is verified, and a new Release is published under the restricted asset/body policy. Preserve the existing README icon/attribution/license material, signing identity, playback/offline/theme/shortcut/sync/full-history regressions and 54-screenshot gate. Do not use force push.
