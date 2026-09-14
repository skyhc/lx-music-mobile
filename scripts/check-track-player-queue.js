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
check('exported methods retain React Native default serial queue instead of blocking main', () => {
  const result = bridge(original)
  assert.ok(result.includes(QUEUE_MARKER))
  assert.ok(!result.includes('methodQueue'))
  assert.ok(result.includes('RCT_EXTERN_METHOD(play)'))
})
check('queue patch is idempotent', () => assert.equal(bridge(bridge(original)), bridge(original)))
check('unknown or duplicate bridge anchors fail instead of silently shipping', () => {
  assert.throws(() => bridge('unrecognised dependency'))
  assert.throws(() => bridge(original + original))
  assert.throws(() => bridge(original + 'methodQueue'))
})
check('lifecycle notifications defer without reading the AVPlayer timeline', () => {
  const result = swift(fixture)
  assert.ok(result.includes(LIFECYCLE_MARKER))
  const lifecycle = result.split(MIX_MARKER)[0]
  assert.ok(lifecycle.includes('DispatchQueue.main.async'))
  assert.ok(lifecycle.includes('if let position = position'))
  assert.ok(lifecycle.includes('if let rate = rate'))
  assert.ok(lifecycle.includes('state ?? self.player.playerState'))
  assert.ok(lifecycle.includes('NotificationCenter.default.post'))
  assert.ok(!lifecycle.includes('self.player.currentTime'))
  assert.ok(!lifecycle.includes('position ??'))
  assert.ok(!lifecycle.includes('DispatchQueue.main.sync'))
})
check('native lifecycle consumer requires position only for explicit seek', () => {
  const app = fs.readFileSync(path.join(base, 'ios/LxMusicMobile/AppDelegate.mm'), 'utf8')
  const start = app.indexOf('static void LXHandleTrackPlayerLifecycleNotification')
  const end = app.indexOf('static void LXRegisterTrackPlayerLifecycleObserver', start)
  assert.ok(start > 0 && end > start)
  const handler = app.slice(start, end)
  assert.ok(handler.includes('event isEqualToString:@"seek"'))
  assert.ok(handler.includes('@"elapsedTime": position ?: @0'))
  assert.ok(handler.includes('event isEqualToString:@"destroy"'))
  assert.ok(handler.includes('event isEqualToString:@"reset"'))
  assert.ok(!handler.includes('@"state"'))
  assert.ok(!handler.includes('@"error"'))
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
  const bridgeSource = fs.readFileSync(path.join(installed, 'RNTrackPlayerBridge.m'), 'utf8')
  assert.ok(bridgeSource.includes(QUEUE_MARKER))
  assert.ok(!bridgeSource.includes('methodQueue'))
  const source = fs.readFileSync(path.join(installed, 'RNTrackPlayer.swift'), 'utf8')
  assert.ok(source.includes(LIFECYCLE_MARKER) && source.includes(MIX_MARKER))
})
console.log(`${checks} TrackPlayer serialization checks passed. Native playback still requires the simulator gate.`)
