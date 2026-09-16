// Full path and section-entry audit; platform limitations are documented, not
// silently removed. This requires actual Git history and runs in Actions.
const fs = require('node:fs'), cp = require('node:child_process'), assert = require('node:assert/strict')
const baseline = '22270f3c02d7ff7c47406ec7bd0410ac1be39371'
const root = 'src/screens/Home/Views/Setting/'
const original = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', root], { encoding: 'utf8' }).trim().split('\n').filter(p => /\.tsx?$/.test(p))
for (const p of original) assert.ok(fs.existsSync(p), 'Deleted setting file: ' + p)
const current = JSON.parse(fs.readFileSync('docs/BUILD85_SETTINGS_AUDIT.json', 'utf8'))
assert.equal(original.length, current.setting_files83)
for (const file of [root + 'Main.tsx', root + 'settings/Search/index.tsx', root + 'settings/List/index.tsx', root + 'settings/Backup/index.tsx']) {
  if (!fs.existsSync(file)) continue
  const before = cp.execFileSync('git', ['show', baseline + ':' + file], { encoding: 'utf8' })
  assert.equal(fs.readFileSync(file, 'utf8'), before, 'Unrelated settings section was rewritten: ' + file)
}
console.log('PASS ' + original.length + ' original settings files retained; unrelated section entries unchanged.')
