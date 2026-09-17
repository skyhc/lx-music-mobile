# Build88 full-batch CI repairs

## Run #96 / 35193008043

Source `8f959da5e8e3ede2ef6e6212026c4d84517d0c06` contains the complete 64-file batch with automatic same-run publication gated by native and binary acceptance. The pre-build suite and full-history TypeScript passed. Actual Apple SDK WebDAV (50) and resumable transfer (19) tests passed. The encrypted backup executable compiled, then failed an assertion that searched raw JSON text for an unescaped destination path after restoring real multi-chunk files.

An isolated execution of the unchanged production rebase reproduced the old assertion failure: Foundation serialized slash characters as escaped JSON, while decoding the value produced the exact destination file path. Apple's JSONSerialization.WritingOptions.withoutEscapingSlashes documentation confirms that serialization option. The test now compares the decoded complete path and additionally checks exact nested playlist and native preference paths. A retained old-container path, a wrong sibling destination and null fail the focused check. No production restore/encryption code, existing rollback assertions, timeout or validation gate was changed.

This repair is not a declaration that the remaining native tests, App smoke tests, Xcode archive or Release passed. The next complete same-source CI must execute them. The published Build87 is unchanged; Build88 completion still requires all existing and new gates plus verified IPA/archive publication.
