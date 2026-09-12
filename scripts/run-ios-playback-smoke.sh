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
