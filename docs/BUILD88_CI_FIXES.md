# Build88 full-batch CI repairs

## Run #96 / 35193008043

Source `8f959da5e8e3ede2ef6e6212026c4d84517d0c06` contains the complete 64-file batch with automatic same-run publication gated by native and binary acceptance. The pre-build suite and full-history TypeScript passed. Actual Apple SDK WebDAV (50) and resumable transfer (19) tests passed. The encrypted backup executable compiled, then failed an assertion that searched raw JSON text for an unescaped destination path after restoring real multi-chunk files.

An isolated execution of the unchanged production rebase reproduced the old assertion failure: Foundation serialized slash characters as escaped JSON, while decoding the value produced the exact destination file path. Apple's JSONSerialization.WritingOptions.withoutEscapingSlashes documentation confirms that serialization option. The test now compares the decoded complete path and additionally checks exact nested playlist and native preference paths. A retained old-container path, a wrong sibling destination and null fail the focused check. No production restore/encryption code, existing rollback assertions, timeout or validation gate was changed.

This repair is not a declaration that the remaining native tests, App smoke tests, Xcode archive or Release passed. The next complete same-source CI must execute them. The published Build87 is unchanged; Build88 completion still requires all existing and new gates plus verified IPA/archive publication.

## Run #97 / 35194081789

Source `f04ef6d875393354be21055c919e508b367e5a27` passed all 50 WebDAV, 19 verified-resume and 42 encrypted-backup/restore assertions on the actual Apple SDK, including process-death and post-credential failure rollback. The subsequent Xcode simulator build failed because the new Swift file references resolved at `ios/` rather than their actual `ios/LxMusicMobile/` location. The display-named application PBXGroup has no filesystem path; an `in Sources` comment alone did not validate source resolution.

The fix qualifies exactly nine new library/service/bridge references with `LxMusicMobile/`, following the existing AppDelegate and window-inset references. Build phases, object identifiers, signing, version settings and application sources are otherwise unchanged. A mandatory early check now uses CocoaPods' actual Xcodeproj parser to resolve every application source and verifies that the nine library paths exist and occur exactly once. It runs before the existing Apple native suite, without removing any previous test.

Independent local checks verify the exact nine-reference diff and reject the original missing-directory form; Ruby syntax and Python driver checks pass. The actual Xcodeproj execution, simulator runtime, full App acceptance, device archive and publication remain the responsibility of the next complete CI run. No old or partial build is published.

## Run #98 / 35196833101

Source `def7e146831b7f3a9f33d0064665ee353f0cc477` passed actual project path resolution, Apple native 50/19/42 tests, simulator compilation, original native playback/sync/offline/theme tests and the 54-image inventory. The new App driver stopped before any App phase because its loopback DAV fixture remained unready at the unchanged 15-second deadline. The child was alive but its server log was empty. This evidence does not prove a production WebDAV failure or a definitive runner root cause.

Independent source review and an executable negative control show that Python HTTPServer calls reverse DNS while binding, before the old ready message. The numeric-loopback-only fixture now binds using TCPServer's bind implementation and sets its own literal server name/port; host DNS and proxy/PAC configuration are not required for local control. It logs a startup phase and emits a bounded startup stack trace if startup stalls. The driver preserves the last health error and process state on failure. The original 15-second limit, exact App phase/check counts and all original/new acceptance gates are unchanged.

Twenty-one focused checks execute the actual handler and child process, including a broken-reverse-DNS control, authentication rejection, Unicode directory XML, exact bytes, conditional resume, temporary PUT/read-back/no-overwrite MOVE and protected final-file deletion. The fixture check runs before the existing Apple suite. These local protocol tests do not replace real App acceptance. Native runtime, encrypted cold restore across App restarts, device archive and publication still require a successful full pipeline.


## Run #99 / 35200573611

The early real-fixture check exposed a test-root mismatch before spending time on Xcode: numeric loopback, HTTP health and missing-credential rejection passed, but PROPFIND returned an empty non-207 response. The executable canonicalizes its root; the imported test did not. macOS temporary paths may use `/var` symlinks, causing the fixture's correct resolved-path containment guard to reject the uncanonical test root. The test now canonicalizes its root exactly like the executable, keeps the production containment check untouched, explicitly rejects an alias-root negative control, and records the HTTP status before parsing XML. All 22 fixture assertions pass locally with a real symlink negative control. Full CI must still prove the Apple runner and actual App outcome.

## Run #100 / 35201334467

Source `4cd488f7592436bfe9099e75aa3d320e7883a264` passed the Apple library suite and simulator compilation. Its first failure occurred before launching the app: the driver's unconditional `simctl terminate` on its just-created simulator timed out after the existing 180-second command limit. No online process/output/report was created; offline was correctly blocked. Later system-theme and orientation checks also failed on that simulator. These secondary failures are retained and are not claimed to have a proven application root cause.

Both test drivers now track launch attempts only for simulators created by that invocation. They do not terminate an application that they have never launched, but every subsequent phase still terminates it. A failed/uncertain launch is conservatively tracked; termination timeouts still fail, and unowned/duplicate devices are rejected. The direct orientation setup launch participates in the same tracker. Pre-report online failures now leave an explicit failed JSON instead of only an absent report. All production source, original timeouts, native assertions, orientation checks, original 54 images, nine new App phases, five new images and same-run publication gates remain unchanged.

Fifteen driver/diagnostic unit tests (including six new lifecycle controls), 22 real fixture/protocol checks, ten sync diagnostics checks, Python syntax, existing library state/UI checks and full-project TypeScript pass locally. Mutation controls reject terminating a never-launched app, skipping later termination and accepting unowned devices. Only the next full native run can establish the actual simulator/App and final Archive/Release results. No Build88 binary or release success is predeclared.
