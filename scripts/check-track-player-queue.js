// Executable patch contract; native timing and transitions are checked in CI.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const { bridge, swift, QUEUE_MARKER, LIFECYCLE_MARKER, MIX_MARKER } = require('../patches/ios/serialize-track-player.cjs')
const base = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(base, 'dependencies-patch.js'), 'utf8')
const start = source.indexOf('    private func postLifecycleEvent(')
const end = source.indexOf('    // MARK: - Lifecycle Methods', start)
assert.ok(start > 0 && end > start)
const fixture = source.slice(start, end) + `
    private func refreshSoundEffectAudioMixOnMainThread() {
        if Thread.isMainThread {
            refreshSoundEffectAudioMix()
            return
        }
        DispatchQueue.main.async { [weak self] in self?.refreshSoundEffectAudioMix() }
    }
`
let checks = 0
const check = (name, fn) => { fn(); checks++; console.log('PASS ' + name) }
const original = '@interface RCT_EXTERN_REMAP_MODULE(TrackPlayerModule, RNTrackPlayer, NSObject)\nRCT_EXTERN_METHOD(play);\n@end\n'
check('exported methods explicitly use the main dispatch queue, not only main-queue setup', () => {
  const result = bridge(original)
  assert.ok(result.includes(QUEUE_MARKER))
  assert.match(result, /- \(dispatch_queue_t\)methodQueue\s*\{\s*return dispatch_get_main_queue\(\);/)
  assert.ok(result.includes('RCT_EXTERN_METHOD(play)'))
})
check('queue patch is idempotent', () => assert.equal(bridge(bridge(original)), bridge(original)))
check('unknown or duplicate bridge anchors fail instead of silently shipping', () => {
  assert.throws(() => bridge('unrecognised dependency'))
  assert.throws(() => bridge(original + original))
  assert.throws(() => bridge(original + 'methodQueue'))
})
check('lifecycle snapshot queries run only in a deferred main-queue block', () => {
  const result = swift(fixture)
  assert.ok(result.includes(LIFECYCLE_MARKER))
  assert.ok(result.indexOf('DispatchQueue.main.async') < result.indexOf('self.player.currentTime'))
  assert.ok(result.includes('position ?? self.player.currentTime'))
  assert.ok(result.includes('state ?? self.player.playerState'))
  assert.ok(result.includes('NotificationCenter.default.post'))
  assert.ok(!result.includes('DispatchQueue.main.sync'))
})
check('observer mix refresh is deferred even on main, preserving the same DSP function', () => {
  const result = swift(fixture).split(MIX_MARKER)[1]
  assert.ok(!result.includes('if Thread.isMainThread'))
  assert.ok(result.includes('DispatchQueue.main.async'))
  assert.ok(result.includes('self?.refreshSoundEffectAudioMix()'))
})
check('Swift patch is idempotent and rejects a missing function', () => {
  assert.equal(swift(swift(fixture)), swift(fixture))
  assert.throws(() => swift('changed dependency'))
})
check('postinstall and native stress tests keep the repair on the actual production path', () => {
  const postinstall = JSON.parse(fs.readFileSync(path.join(base, 'package.json'), 'utf8')).scripts.postinstall
  assert.ok(postinstall.includes('node dependencies-patch.js && node patches/ios/serialize-track-player.cjs'))
  const smoke = fs.readFileSync(path.join(base, 'src/tests/playbackSmoke.tsx'), 'utf8')
  assert.ok(smoke.includes('repeated remote/cache transition'))
  assert.ok(smoke.includes('for (let pass = 0; pass < 3; pass++)'))
})
const installed = path.join(base, 'node_modules/react-native-track-player/ios/RNTrackPlayer')
if (fs.existsSync(installed)) check('installed native dependency carries all three fixes', () => {
  assert.ok(fs.readFileSync(path.join(installed, 'RNTrackPlayerBridge.m'), 'utf8').includes(QUEUE_MARKER))
  const source = fs.readFileSync(path.join(installed, 'RNTrackPlayer.swift'), 'utf8')
  assert.ok(source.includes(LIFECYCLE_MARKER) && source.includes(MIX_MARKER))
})
console.log(`${checks} TrackPlayer serialization checks passed. Native playback still requires the simulator gate.`)
