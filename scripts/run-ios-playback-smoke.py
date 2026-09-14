#!/usr/bin/env python3
"""Run simulator checks and retain their actual reports, including failures."""
from __future__ import annotations
import hashlib
import json
import math
import os
import re
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import time
import urllib.request
import wave

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'build/checks'
HTTP = ROOT / 'build/smoke-http'
APP = ROOT / 'build/Simulator/Build/Products/Release-iphonesimulator/LxMusicMobile.app'
BUNDLE = 'com.skyhc.lxmusic'
FORMS = ('tablet', 'tabletportrait', 'phone')
PHASES = ('table', 'favorites', 'list', 'settings', 'menu', 'navhidden', 'library',
          'keyboard', 'darktable', 'darkmenu', 'darklibrary', 'darklist',
          'themeswitch', 'lightagain', 'palette-grey', 'palette-orange',
          'palette-purple', 'palette-blue')
for name, expected in (('LX_UI_FORMS', FORMS), ('LX_UI_PHASES', PHASES)):
    if name in os.environ and tuple(os.environ[name].split()) != expected:
        raise RuntimeError(f'Capture matrix mismatch: {name}')
XCRUN = '/usr/bin/xcrun'


def command(*args: str, timeout: int = 180, check: bool = True) -> str:
    print('RUN', ' '.join(str(a) for a in args), flush=True)
    process = subprocess.run(args, cwd=ROOT, text=True, stdout=subprocess.PIPE,
                             stderr=subprocess.STDOUT, timeout=timeout)
    with (OUT / 'native-driver.log').open('a') as log:
        log.write('$ ' + ' '.join(str(a) for a in args) + '\n' + process.stdout + '\n')
    if check and process.returncode:
        raise RuntimeError(f'Command failed ({process.returncode}): {args}\n{process.stdout[-5000:]}')
    return process.stdout.strip()


def sample_process(pid: str, destination: Path) -> None:
    """Optional diagnostics for our simulator app, without elevated privileges."""
    if not pid.isdigit():
        raise ValueError('The simulator process id must be numeric')
    try:
        command('/usr/bin/sample', pid, '2', '-file', str(destination), check=False, timeout=15)
    except (subprocess.TimeoutExpired, OSError, RuntimeError) as error:
        message = f'DIAGNOSTIC-ONLY: sampling pid {pid} failed: {type(error).__name__}: {error}'
        with (OUT / 'native-driver.log').open('a') as log:
            log.write(message + '\n')
        print(message, flush=True)


def simctl(*args: str, **kwargs) -> str:
    return command(XCRUN, 'simctl', *args, **kwargs)


def save_json(path: Path, data: object) -> None:
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf8')
    temporary.replace(path)


def wait_for_service(url: str, process: subprocess.Popen, timeout: int = 45) -> None:
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f'Service exited before ready: {url}')
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return
        except OSError:
            pass
        time.sleep(.5)
    raise RuntimeError(f'Service did not become ready: {url}')


def stop(process: subprocess.Popen | None) -> None:
    if process is None or process.poll() is not None:
        return
    process.terminate()
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def run() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    HTTP.mkdir(parents=True, exist_ok=True)
    if not APP.is_dir():
        raise RuntimeError(f'Release simulator app missing: {APP}')
    command(sys.executable, str(ROOT / 'scripts/check-smoke-diagnostic-failure.py'))
    for pattern in ('ui-*.png', 'ui-*.json', 'playback-*.json', 'UI-MANIFEST.json'):
        for path in OUT.glob(pattern):
            path.unlink()
    with wave.open(str(HTTP / 'tone.wav'), 'wb') as audio:
        audio.setnchannels(1)
        audio.setsampwidth(2)
        audio.setframerate(16000)
        audio.writeframes(b''.join(struct.pack('<h', int(6000 * math.sin(2 * math.pi * 440 * i / 16000)))
                                   for i in range(30 * 16000)))
    if not shutil.which('ffmpeg'):
        command('brew', 'install', 'ffmpeg', timeout=300)
    command('ffmpeg', '-v', 'error', '-y', '-i', str(HTTP / 'tone.wav'), '-c:a', 'flac', str(HTTP / 'tone.flac'))
    command('ffmpeg', '-v', 'error', '-y', '-i', str(HTTP / 'tone.wav'), '-c:a', 'libmp3lame', '-b:a', '64k', str(HTTP / 'tone.mp3'))
    simulators: list[str] = []
    audio_server = sync_server = None
    logs = []
    started = time.time()
    try:
        def service(args: list[str], name: str) -> subprocess.Popen:
            log = (OUT / name).open('w')
            logs.append(log)
            return subprocess.Popen(args, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT)
        command(sys.executable, str(ROOT / 'scripts/check-smoke-media-server.py'))
        audio_server = service([sys.executable, '-u', str(ROOT / 'scripts/smoke-media-server.py'), str(HTTP)], 'smoke-http.log')
        sync_server = service(['node', str(ROOT / 'scripts/sync-peer-fixture.cjs'), str(ROOT / 'build/official-sync')], 'sync-peer.log')
        wait_for_service('http://127.0.0.1:18779/tone.wav', audio_server)
        wait_for_service('http://127.0.0.1:18781/health', sync_server)
        runtimes = json.loads(simctl('list', 'runtimes', '-j'))['runtimes']
        runtime = next(r['identifier'] for r in runtimes if r['isAvailable'] and 'iOS' in r['name'])
        device_types = json.loads(simctl('list', 'devicetypes', '-j'))['devicetypes']
        tablet_type = next(d['identifier'] for d in device_types if 'iPad Pro' in d['name'] and '13' in d['name'])
        phone_type = next(d['identifier'] for d in device_types if re.match(r'iPhone (17|16|15) Pro(?: |$)', d['name']))

        def create(kind: str) -> str:
            simulator = simctl('create', 'LXBuild86-' + str(len(simulators)), kind, runtime)
            simulators.append(simulator)
            simctl('boot', simulator)
            simctl('bootstatus', simulator, '-b', timeout=300)
            simctl('install', simulator, str(APP))
            return simulator

        def launch_and_record(simulator: str, name: str, arguments: list[str], phase: str | None = None) -> dict:
            simctl('terminate', simulator, BUNDLE, check=False)
            data = Path(simctl('get_app_container', simulator, BUNDLE, 'data'))
            report_path = data / 'Documents/playback-smoke.json'
            report_path.unlink(missing_ok=True)
            launch_result = simctl('launch', '--stdout=' + str(OUT / (name + '.out')), '--stderr=' + str(OUT / (name + '.err')),
                                   simulator, BUNDLE, '--lx-playback-smoke', *arguments)
            pid = re.search(r': (\d+)\s*$', launch_result)
            def sample_failure() -> None:
                if pid:
                    sample_process(pid.group(1), OUT / (name + '-threads.txt'))
            deadline = time.monotonic() + (90 if phase else 300)
            last = None
            early_sampled = False
            while time.monotonic() < deadline:
                try:
                    raw = report_path.read_bytes()
                    last = json.loads(raw)
                except (OSError, ValueError):
                    time.sleep(.5)
                    continue
                # A blocked native queue cannot publish the JS watchdog result.
                # Sample our app while it is still alive, rather than waiting
                # until iOS kills it and a 300-second outer deadline expires.
                probes = last.get('probes') or []
                pending = probes[-1] if probes else {}
                if (phase is None and not early_sampled and pid and not last.get('done')
                        and pending.get('started') and 'elapsed' not in pending
                        and time.time() * 1000 - pending['started'] > 8000):
                    early_sampled = True
                    save_json(OUT / (name + '-stalled.json'), last)
                    sample_process(pid.group(1), OUT / (name + '-stalled-threads.txt'))
                if last.get('done'):
                    if last.get('success') is not True:
                        save_json(OUT / (name + '.json'), last)
                        sample_failure()
                        raise RuntimeError(f'{name} failed: {last}')
                    if phase is not None and last.get('phase') != phase:
                        raise RuntimeError(f'{name}: stale or mismatched native phase {last}')
                    (OUT / (name + '.json')).write_bytes(raw)
                    print('NATIVE-RECORD', name, json.dumps(last, ensure_ascii=False), flush=True)
                    return last
                time.sleep(.5)
            if last is not None:
                save_json(OUT / (name + '.json'), last)
            sample_failure()
            raise RuntimeError(f'Timed out waiting for native result: {name}')

        tablet = create(tablet_type)
        native_failures = []
        try:
            launch_and_record(tablet, 'playback-online', [])
        except RuntimeError as error:
            native_failures.append(str(error))
        stop(audio_server)
        audio_server = None
        try:
            launch_and_record(tablet, 'playback-offline', ['--lx-playback-offline'])
        except RuntimeError as error:
            native_failures.append(str(error))
        # Capture UI independently, but do not release if native checks failed.
        # A separate UI-test bundle performs real simulated hardware rotation.
        # It does not alter the release app, its Info.plist or reported geometry.
        command('bundle', 'exec', 'ruby', str(ROOT / 'scripts/create-ui-orientation-driver.rb'))
        command('/usr/bin/xcodebuild', 'build-for-testing', '-project', str(ROOT / 'build/LXUIDriver.xcodeproj'),
                '-scheme', 'LXUIDriver', '-configuration', 'Release', '-sdk', 'iphonesimulator',
                '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', str(ROOT / 'build/UIDriver'),
                'ARCHS=arm64', 'ONLY_ACTIVE_ARCH=YES', 'CODE_SIGNING_ALLOWED=NO', timeout=180)
        inventory = []
        for form in FORMS:
            simulator = create(phone_type) if form == 'phone' else tablet
            # Activate an installed app before XCTest takes control of orientation.
            simctl('launch', simulator, BUNDLE, '--lx-playback-smoke', '--lx-ui=table')
            method = 'testLandscape' if form == 'tablet' else 'testPortrait'
            command('/usr/bin/xcodebuild', 'test-without-building', '-project', str(ROOT / 'build/LXUIDriver.xcodeproj'),
                    '-scheme', 'LXUIDriver', '-configuration', 'Release', '-destination', 'platform=iOS Simulator,id=' + simulator,
                    '-derivedDataPath', str(ROOT / 'build/UIDriver'), '-parallel-testing-enabled', 'NO',
                    '-only-testing:LXUIDriver/OrientationTests/' + method,
                    '-resultBundlePath', str(OUT / ('orientation-' + form + '.xcresult')),
                    'CODE_SIGNING_ALLOWED=NO', timeout=180)
            for phase in PHASES:
                name = f'ui-{form}-{phase}'
                args = ['--lx-ui=' + phase]
                if form == 'tablet':
                    args.append('--lx-ui-landscape')
                record = launch_and_record(simulator, name, args, phase)
                time.sleep(1)
                image = OUT / (name + '.png')
                simctl('io', simulator, 'screenshot', '--type=png', str(image))
                content = image.read_bytes()
                if not content.startswith(b'\x89PNG\r\n\x1a\n') or len(content) < 1024:
                    raise RuntimeError(f'Invalid screenshot: {image}')
                width, height = struct.unpack('>II', content[16:24])
                if min(width, height) < 600:
                    raise RuntimeError(f'Unexpected screenshot dimensions: {width}x{height}')
                if record['native'].get('deviceIdiom') != (0 if form == 'phone' else 1):
                    raise RuntimeError(f'Wrong device family or compatibility-mode app for {name}: {record}')
                if (form == 'tablet') != (record['width'] > record['height']):
                    raise RuntimeError(f'Wrong window orientation for {name}: {record}')
                item = {'image': image.name, 'report': name + '.json', 'bytes': len(content),
                        'sha256': hashlib.sha256(content).hexdigest(), 'width': width, 'height': height}
                inventory.append(item)
                save_json(OUT / 'UI-MANIFEST.json', {'commit': os.environ.get('GITHUB_SHA'), 'run': os.environ.get('GITHUB_RUN_ID'),
                           'count': len(inventory), 'screenshots': inventory})
                print('EVIDENCE', json.dumps(item), flush=True)
        if len(inventory) != 54:
            raise RuntimeError(f'Incomplete capture set: {len(inventory)}')
        for item in inventory:
            content = (OUT / item['image']).read_bytes()
            if hashlib.sha256(content).hexdigest() != item['sha256']:
                raise RuntimeError(f'Changed capture: {item["image"]}')
        if native_failures:
            raise RuntimeError('Native checks failed; device archive remains blocked: ' + '\n'.join(native_failures))
        print('Native playback records and 54 production-view screenshots are present at ' + str(OUT), flush=True)
    finally:
        save_json(OUT / 'native-evidence-files.json', {'started': started, 'finished': time.time(), 'root': str(OUT),
                  'files': [{'name': p.name, 'bytes': p.stat().st_size} for p in sorted(OUT.iterdir()) if p.is_file()]})
        stop(audio_server)
        stop(sync_server)
        for simulator in simulators:
            simctl('shutdown', simulator, check=False)
            simctl('delete', simulator, check=False)
        for log in logs:
            log.close()


if __name__ == '__main__':
    run()
