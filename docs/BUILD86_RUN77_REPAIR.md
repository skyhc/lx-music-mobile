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
