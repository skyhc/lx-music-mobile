const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = p => fs.readFileSync(path.join(root, p), 'utf8')

const constants = read('src/config/constant.ts')
assert.ok(constants.indexOf("{ id: 'nav_library', icon: 'download-2' }") < constants.indexOf("{ id: 'nav_setting', icon: 'setting' }"), 'Download icon must be above Settings')

const download = read('src/screens/Home/Views/Download/index.js')
assert.match(download, /Library\/Downloads/)
assert.doesNotMatch(download, /settings\/Download/)
const legacyLibrary = read('src/screens/Home/Views/Library/index.tsx')
assert.match(legacyLibrary, /\.\.\/Download/)
for (const token of ['library-tab-webdav', 'library-tab-downloads', 'library-tab-backup']) assert.ok(!legacyLibrary.includes(token), 'Combined Library tabs must be retired: ' + token)

const page = read('src/core/library/page.ts')
assert.match(page, /setNavActiveId\('nav_library'\)/)
assert.match(page, /setNavActiveId\('nav_setting'\)/)
assert.match(page, /openLibrarySettings/)

const settingsMain = read('src/screens/Home/Views/Setting/Main.tsx')
assert.match(settingsMain, /'webdav'/)
assert.match(settingsMain, /settings\/WebDAV/)

const webdav = read('src/screens/Home/Views/Setting/settings/WebDAV/index.tsx')
for (const token of ['library-account-endpoint', 'library-account-password', 'library-directory-cache', 'library-audio-cache', 'library-import']) assert.ok(webdav.includes(token), 'Missing unified WebDAV control: ' + token)
assert.match(webdav, /targetListId/)
assert.doesNotMatch(webdav, /createEncryptedBackup|downloadQueue\.configure/)

const backup = read('src/screens/Home/Views/Setting/settings/Backup/EncryptedBackup.tsx')
for (const token of ['createEncryptedBackup', 'uploadBackup', 'fetchBackup', 'stageEncryptedRestore', 'armRestore']) assert.ok(backup.includes(token), 'Missing backup flow: ' + token)
assert.match(backup, /openLibrarySettings\('webdav'\)/)
assert.doesNotMatch(backup, /saveAccount|library-account-endpoint|library-account-password/)

const downloadSettings = read('src/screens/Home/Views/Setting/settings/Download/index.tsx')
assert.match(downloadSettings, /useLibrary/)
assert.match(downloadSettings, /destination: \{ kind: 'webdav'/)
assert.doesNotMatch(downloadSettings, /library-account-password|saveAccount/)

const releasePolicy = read('scripts/ios_release_policy.py')
assert.match(releasePolicy, /headings == \['## 更新日志', '## 系统要求'\]/)
assert.match(releasePolicy, /release_assets': \[ipa_name, archive_name, 'SHA256SUMS\.txt'\]/)
assert.match(releasePolicy, /set\(local\) == \{\*binary_names\(metadata\), 'SHA256SUMS\.txt'\}/)

console.log('PASS Build88 feature boundaries: Download, WebDAV, Backup/Restore and Release responsibilities are separated and wired.')
