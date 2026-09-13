#!/bin/bash
set -euo pipefail
mkdir -p build/checks build/smoke-http
python3 - <<'PYTHON'
import math, struct, wave
with wave.open('build/smoke-http/tone.wav', 'wb') as out:
    out.setnchannels(1); out.setsampwidth(2); out.setframerate(16000)
    out.writeframes(b''.join(struct.pack('<h', int(6000*math.sin(2*math.pi*440*i/16000))) for i in range(12*16000)))
PYTHON
if ! command -v ffmpeg >/dev/null; then brew install ffmpeg; fi
ffmpeg -v error -y -i build/smoke-http/tone.wav -c:a flac build/smoke-http/tone.flac
ffmpeg -v error -y -i build/smoke-http/tone.wav -c:a libmp3lame -b:a 64k build/smoke-http/tone.mp3
# Test both genuine NSURLSession and AVURLAsset, not an FS-only substitute.
python3 -m http.server 18779 --bind 127.0.0.1 --directory build/smoke-http > build/checks/smoke-http.log 2>&1 &
SERVER_PID=$!
DEVICE_TYPE=$(xcrun simctl list devicetypes | grep -E 'iPad Pro.*13' | head -1 | sed -E 's/.*\(([^)]+)\)$/\1/')
RUNTIME=$(xcrun simctl list runtimes -j | python3 -c 'import sys,json; print(next(r["identifier"] for r in json.load(sys.stdin)["runtimes"] if r["isAvailable"] and "iOS" in r["name"]))')
SIM=$(xcrun simctl create LXPlaybackSmoke "$DEVICE_TYPE" "$RUNTIME")
trap 'kill "$SERVER_PID" 2>/dev/null || true; xcrun simctl shutdown "$SIM" >/dev/null 2>&1 || true; xcrun simctl delete "$SIM" >/dev/null 2>&1 || true' EXIT
xcrun simctl boot "$SIM"
xcrun simctl bootstatus "$SIM" -b
APP="build/Simulator/Build/Products/Release-iphonesimulator/LxMusicMobile.app"
xcrun simctl install "$SIM" "$APP"
DATA=$(xcrun simctl get_app_container "$SIM" com.skyhc.lxmusic data)
for PHASE in online offline; do
  rm -f "$DATA/Documents/playback-smoke.json"
  EXTRA=()
  if [ "$PHASE" = offline ]; then
    xcrun simctl terminate "$SIM" com.skyhc.lxmusic || true
    kill "$SERVER_PID"; wait "$SERVER_PID" 2>/dev/null || true
    EXTRA=(--lx-playback-offline)
  fi
  xcrun simctl launch --stdout="$(pwd)/build/checks/simulator-$PHASE.out" --stderr="$(pwd)/build/checks/simulator-$PHASE.err" "$SIM" com.skyhc.lxmusic --lx-playback-smoke "${EXTRA[@]}"
  DONE=0
  for i in $(seq 1 100); do
    if [ -f "$DATA/Documents/playback-smoke.json" ]; then
      cp "$DATA/Documents/playback-smoke.json" "build/checks/playback-$PHASE.json"
      if python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("done") else 1)' "build/checks/playback-$PHASE.json"; then DONE=1; break; fi
    fi
    sleep 3
  done
  if [ "$DONE" != 1 ]; then echo "Simulator $PHASE timed out"; cat "build/checks/playback-$PHASE.json" || true; exit 1; fi
  cat "build/checks/playback-$PHASE.json"
  python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["success"], d.get("error")' "build/checks/playback-$PHASE.json"
done
# Capture real production component rendering at tablet and phone window sizes.
# This is visual evidence, not an automated touch-interaction test.
for FORM in tablet tabletportrait phone; do
  if [ "$FORM" = phone ]; then
    xcrun simctl shutdown "$SIM"; xcrun simctl delete "$SIM"
    PHONE_TYPE=$(xcrun simctl list devicetypes | grep -E 'iPhone (17|16|15) Pro \(' | head -1 | sed -E 's/.*\(([^)]+)\)$/\1/')
    SIM=$(xcrun simctl create LXPhoneUIReview "$PHONE_TYPE" "$RUNTIME")
    xcrun simctl boot "$SIM"; xcrun simctl bootstatus "$SIM" -b
    xcrun simctl install "$SIM" "$APP"
    DATA=$(xcrun simctl get_app_container "$SIM" com.skyhc.lxmusic data)
  fi
  for UI in table favorites list settings menu navhidden; do
    xcrun simctl terminate "$SIM" com.skyhc.lxmusic || true
    rm -f "$DATA/Documents/playback-smoke.json"
    EXTRA=(); if [ "$FORM" = tablet ]; then EXTRA=(--lx-ui-landscape); fi
    xcrun simctl launch --stdout="$(pwd)/build/checks/ui-$FORM-$UI.out" --stderr="$(pwd)/build/checks/ui-$FORM-$UI.err" "$SIM" com.skyhc.lxmusic --lx-playback-smoke "--lx-ui=$UI" "${EXTRA[@]}"
    DONE=0
    for i in $(seq 1 30); do
      if [ -f "$DATA/Documents/playback-smoke.json" ]; then
        cp "$DATA/Documents/playback-smoke.json" "build/checks/ui-$FORM-$UI.json"
        if python3 -c 'import json,sys; sys.exit(0 if json.load(open(sys.argv[1])).get("done") else 1)' "build/checks/ui-$FORM-$UI.json"; then DONE=1; break; fi
      fi
      sleep 2
    done
    if [ "$DONE" != 1 ]; then echo "UI fixture did not render: $FORM $UI"; exit 1; fi
    python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); assert d["success"], d' "build/checks/ui-$FORM-$UI.json"
    sleep 2
    xcrun simctl io "$SIM" screenshot "build/checks/ui-$FORM-$UI.png"
  done
done

# Require the individual runtime records and screenshots, not just an exit code.
python3 - <<'PYTHON'
import json, pathlib
p = pathlib.Path('build/checks')
for phase in ['online', 'offline']:
    report = json.loads((p / ('playback-' + phase + '.json')).read_text())
    assert report.get('success') and report.get('done'), report
for form in ['tablet', 'tabletportrait', 'phone']:
    for ui in ['table', 'favorites', 'list', 'settings', 'menu', 'navhidden']:
        name = 'ui-' + form + '-' + ui
        report = json.loads((p / (name + '.json')).read_text())
        assert report.get('success'), report
        assert (p / (name + '.png')).stat().st_size > 1024, name
print('Native playback records and 18 production-view screenshots are present.')
PYTHON
