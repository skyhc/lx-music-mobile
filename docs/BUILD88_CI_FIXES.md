# Build88 full-batch CI repairs

## Run #96 / 35193008043

Source `8f959da5e8e3ede2ef6e6212026c4d84517d0c06` contains the complete 64-file batch with automatic same-run publication gated by native and binary acceptance. The pre-build suite and full-history TypeScript passed. Actual Apple SDK WebDAV (50) and resumable transfer (19) tests passed. The encrypted backup executable compiled, then failed an assertion that searched raw JSON text for an unescaped destination path after restoring real multi-chunk files.

An isolated execution of the unchanged production rebase reproduced the old assertion failure: Foundation serialized slash characters as escaped JSON, while decoding the value produced the exact destination file path. Apple's JSONSerialization.WritingOptions.withoutEscapingSlashes documentation confirms that serialization option. The test now compares the decoded complete path and additionally checks exact nested playlist and native preference paths. A retained old-container path, a wrong sibling destination and null fail the focused check. No production restore/encryption code, existing rollback assertions, timeout or validation gate was changed.

This repair is not a declaration that the remaining native tests, App smoke tests, Xcode archive or Release passed. The next complete same-source CI must execute them. The published Build87 is unchanged; Build88 completion still requires all existing and new gates plus verified IPA/archive publication.

## Run #97 / 35194081789

Source `f04ef6d875393354be21055c919e508b367e5a27` passed all 50 WebDAV, 19 verified-resume and 42 encrypted-backup/restore assertions on the actual Apple SDK, including process-death and post-credential failure rollback. The subsequent Xcode simulator build failed because the new Swift file references resolved at `ios/` rather than their actual `ios/LxMusicMobile/` location. The display-named application PBXGroup has no filesystem path; an `in Sources` comment alone did not validate source resolution.

The fix qualifies exactly nine new library/service/bridge references with `LxMusicMobile/`, following the existing AppDelegate and window-inset references. Build phases, object identifiers, signing, version settings and application sources are otherwise unchanged. A mandatory early check now uses CocoaPods' actual Xcodeproj parser to resolve every application source and verifies that the nine library paths exist and occur exactly once. It runs before the existing Apple native suite, without removing any previous test.

Independent local checks verify the exact nine-reference diff and reject the original missing-directory form; Ruby syntax and Python driver checks pass. The actual Xcodeproj execution, simulator runtime, full App acceptance, device archive and publication remain the responsibility of the next complete CI run. No old or partial build is published.
