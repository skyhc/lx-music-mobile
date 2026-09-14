# Build86 — native playback / run77 repair

Base: d418514d364a3bb0ea013701d9b6ae3a4af5e6a0. No version, signing, bundle, UI palette, native decoder, audio DSP, cache storage or synchronization protocol change in this repair.

## Evidence

- Run77: dependency and TypeScript checks and the simulator application build passed. Native online playback failed at MP3 cold start with a getPosition request exceeding 3000ms. MP3 offline playback passed; the online phase never completed FLAC preparation. No valid blocking thread sample was obtained.
- The last green run57 (0ea5c21) is not a valid native playback baseline. Its job log reports `scripts/run-ios-playback-smoke.sh: line 43: EXTRA[@]: unbound variable`, followed by artifact/archive steps. Its evidence archive lacks online/offline JSON and UI records. This repair does not restore that false-green path.
- Pinned SwiftAudioEx 0.14.7 directly calls AVPlayer and AVPlayerItem delegates from observeValue. AudioPlayer's state handler queries time/duration/rate, changes the pitch algorithm, and changes rate. The existing TrackPlayer main methodQueue and deferred notifications do not move these upstream KVO callbacks. This is a source-confirmed reentry/race hazard, not a claim that a particular deadlock stack was captured in run77.

## Changes

- CocoaPods applies and verifies a strict, idempotent patch to both installed KVO observers. Delegates execute asynchronously on main after returning to AVFoundation. Stopped observers and old player/item objects are rejected; player status is read at delivery to avoid restoring stale ready/paused notifications.
- Simulator-only native getPosition entry/exit traces distinguish an unentered bridge request from a time read that did not return. Actual position and production device behavior are unchanged.
- The driver records timed-out commands and their partial output, not only commands that returned. It shuts down its own preceding tablet before booting the phone, retaining all 54 required screenshots and device/orientation checks.
- Offline validation only runs after online preparation passes. A failed prerequisite produces an explicit unsuccessful blocked report and still prevents release. It is not mislabeled as loss of a completed FLAC cache.

## Executed before commit

- The transformed production Swift callback bodies were compiled and executed in a controlled harness. The original inline callbacks fail the same reentry assertion; patched callbacks pass deferred delivery, queue identity, current state, old player/item rejection, duration/range/metadata and stopped-observer checks. This is not an AVFoundation playback test.
- Nine Python diagnostic/driver failure tests passed. Media fixture full/partial/HEAD/invalid-range/concurrent request tests passed.
- Existing TrackPlayer patch checks, all 571 TS/TSX/declaration syntax checks, Build86 plus all 16 theme shared-accent checks, Build82, Build81, iPad player/window layouts and production storage/catalog race checks passed locally.
- Ruby syntax and git whitespace checks passed. All native playback, complete visual matrix, Archive and IPA gates remain enabled. Their result must be checked using this repair commit's Actions SHA; no successful native build is predeclared here.

## Run78 cross-check and follow-up

- Run78 on `d448b69c8738229920ca26976bd1fd35d9993d25` confirmed that the KVO patch installed and the simulator application compiled. Sync checks again passed and the visual driver produced all 54 required screenshots for the same SHA. Native online playback still failed at MP3 cold start; offline playback was correctly reported as blocked rather than as a false cache-loss failure.
- The simulator-only trace narrowed the failed request: `getPosition` entered native code at `19:03:04.748` and returned from `player.currentTime` at `19:03:07.845`, about 3.097 seconds later. The JavaScript gate is 3000 ms. This means the failed request did reach the native export; the synchronous timeline read itself exceeded the gate.
- Run74 on parent `e1314ec444fdfd0233e8da9a3dc8203412a33c04`, before commit `3105a0b8b823321ea1e0b133578f41c5c28b5987` forced exported TrackPlayer methods onto the main queue, passed the same MP3 cold-remote check. Its slowest early position read was about 1769 ms, followed by normal position advancement. Run74 later stalled during MP3 local-cache transition. Commit `3105a0b...` was added to address that later transition by moving every exported method to main, but Run78 shows this introduced an earlier main-queue timeline stall.
- The new KVO deferral from `d448b69c...` addresses the observer reentry hazard that motivated the earlier serialization attempt. The follow-up therefore removes only the forced main `methodQueue` override and keeps React Native's default serial module queue, while retaining the KVO, lifecycle and audio-mix deferrals.
- `LXHandleTrackPlayerLifecycleNotification` consumes a timeline position only for explicit `seek`; state/error lifecycle notifications do not use position. The follow-up stops querying `player.currentTime` merely to populate unused state/error notification fields. Explicit seek still sends the requested position.
- The next simulator trace records whether `getPosition` executes on main so the Actions evidence can verify that the forced-main regression is actually gone. Native playback success is not assumed until the complete online/offline simulator gates pass.
