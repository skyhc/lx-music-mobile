// Serialise the bridge and SwiftAudio callbacks on the same queue. This does
// not change decoders, buffering policy, volume, seek semantics or cache data.
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const QUEUE_MARKER = '// LX_SERIAL_PLAYBACK_QUEUE_V1'
const LIFECYCLE_MARKER = '// LX_DEFER_LIFECYCLE_SNAPSHOT_V1'
const MIX_MARKER = '// LX_DEFER_AUDIO_MIX_REFRESH_V1'

function bridge(source) {
  if (source.includes(QUEUE_MARKER)) return source
  const anchor = '@interface RCT_EXTERN_REMAP_MODULE(TrackPlayerModule, RNTrackPlayer, NSObject)'
  assert.equal(source.split(anchor).length, 2, 'Unexpected TrackPlayer bridge: queue anchor must be unique')
  assert.ok(!source.includes('methodQueue'), 'Review existing TrackPlayer queue before replacing it')
  // RCT_EXTERN_REMAP_MODULE expands to the RCTExternModule category
  // implementation. Use the documented Objective-C methodQueue override.
  return source.replace(anchor, anchor + `

${QUEUE_MARKER}
// requiresMainQueueSetup only controls construction, not exported methods.
// Queue mutation, position queries and AVPlayer observation must not race.
- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}
`)
}
function swift(source) {
  let result = source
  if (!result.includes(LIFECYCLE_MARKER)) {
    const expression = /    private func postLifecycleEvent\(_ event: String,[\s\S]*?\n    }\n/
    assert.equal((result.match(new RegExp(expression.source, 'g')) || []).length, 1, 'Unexpected lifecycle function')
    result = result.replace(expression, `    private func postLifecycleEvent(_ event: String, state: AVPlayerWrapperState? = nil, position: Double? = nil, rate: Float? = nil, extra: [String: Any] = [:]) {
        ${LIFECYCLE_MARKER}
        // AVFoundation/KVO callbacks can arrive while a player lock is held.
        // Do not synchronously query the timeline or wait for a main-queue
        // NotificationCenter observer from inside that callback.
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            var userInfo = extra
            userInfo["event"] = event
            userInfo["state"] = self.lifecycleStateName(state ?? self.player.playerState)
            userInfo["position"] = position ?? self.player.currentTime
            userInfo["rate"] = rate ?? self.player.rate
            userInfo["track"] = self.player.currentIndex
            NotificationCenter.default.post(name: lxTrackPlayerLifecycleNotification, object: self, userInfo: userInfo)
        }
    }
`)
  }
  if (!result.includes(MIX_MARKER)) {
    const expression = /    private func refreshSoundEffectAudioMixOnMainThread\(\) \{[\s\S]*?\n    }\n/
    assert.equal((result.match(new RegExp(expression.source, 'g')) || []).length, 1, 'Unexpected sound-effect refresh function')
    result = result.replace(expression, `    private func refreshSoundEffectAudioMixOnMainThread() {
        ${MIX_MARKER}
        // Leave the observer callback before mutating the AVPlayerItem mix,
        // even when the callback already happens to run on the main thread.
        DispatchQueue.main.async { [weak self] in
            self?.refreshSoundEffectAudioMix()
        }
    }
`)
  }
  return result
}
function apply(root) {
  const base = path.join(root, 'node_modules/react-native-track-player/ios/RNTrackPlayer')
  for (const [name, transform] of [['RNTrackPlayerBridge.m', bridge], ['RNTrackPlayer.swift', swift]]) {
    const file = path.join(base, name)
    const previous = fs.readFileSync(file, 'utf8')
    const next = transform(previous)
    if (previous !== next) fs.writeFileSync(file, next)
    console.log('Verified serial iOS playback patch: ' + name)
  }
}
module.exports = { apply, bridge, swift, QUEUE_MARKER, LIFECYCLE_MARKER, MIX_MARKER }
if (require.main === module) apply(path.resolve(__dirname, '../..'))
