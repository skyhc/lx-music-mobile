from pathlib import Path
import hashlib, json, subprocess

def run(*args):
    return subprocess.check_output(args, text=True).strip()
assert run('git','rev-parse','HEAD^') == 'be61344f82e77206b4a1b4062124e1d57804f34c', 'Base changed; refuse overwrite'
for file in sorted(Path('.github/repair-build86').glob('*.patch')):
    file.write_text(file.read_text().replace('\n diff --git ', '\ndiff --git '))
    subprocess.run(['git','apply','--recount','--check',str(file)],check=True)
    subprocess.run(['git','apply','--recount',str(file)],check=True)
def replace(file, old, new):
    p=Path(file);s=p.read_text();assert s.count(old)==1,(file,old);p.write_text(s.replace(old,new))
replace('scripts/run-ios-playback-smoke.py', '''        inventory = []
        for form in FORMS:
            simulator = create(phone_type) if form == 'phone' else tablet
''', '''        # A separate UI-test bundle performs real simulated hardware rotation.
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
''')
p=Path('docs/BUILD86_BASELINE_HASHES.json');a=json.loads(p.read_text());a.pop('src/plugins/sync/listEvent.ts');p.write_text(json.dumps(a,indent=2)+'\n')
replace('scripts/check-build86-regressions.js', "check('build version and changelog identify this visual-only release; native/audio/sync files are untouched', () => {", "check('build identity and unchanged audio/auth/scene fingerprints; catalog repair has its own behavioral gate', () => {")
replace('scripts/check-build86-regressions.js', "  const audit = JSON.parse(read('docs/BUILD86_BASELINE_HASHES.json'))", "  assert.ok(read('src/plugins/sync/listEvent.ts').includes('global.list_event.list_data_snapshot()'))\n  assert.ok(read('.github/workflows/ios-ipa.yml').includes('node scripts/check-sync-catalog-race.js'))\n  const audit = JSON.parse(read('docs/BUILD86_BASELINE_HASHES.json'))")
replace('CHANGELOG.md','## iOS / iPadOS 1.9.0 Build 86 · 2026-09-14\n','## iOS / iPadOS 1.9.0 Build 86 · 2026-09-14\n\n- 续修同步重连失败：已用生产存储代码复现保存元数据期间的空值被重读为删除；目录改为一次初始化与迟到读取保护，同步快照排入持久化修改队列并深拷贝，新增6项确定性竞争回归。\n- 续修截图失败：独立XCTest驱动旋转真实模拟设备，不再让iPad窗口内应用强制旋转；仍要求实际尺寸、设备类型、颜色和全部54份截图验证通过。详见docs/BUILD86_FINAL_REPAIR.md。\n')
expected={
 'src/utils/listManage.ts':'16c02566cb02f2e1403c77a06217d05e32d5345b3e36d1b476cc9a51760ec4ad',
 'src/event/listEvent.ts':'13d6e9068324798a3abba9b0ae107573802e76d2636e56b5facd4ca7228aa659',
 'src/plugins/sync/listEvent.ts':'c1f07b64c765c4b9ce7611813dcc8875dcb3c987116539089177174c914d6e1e',
 'src/tests/uiSmoke.tsx':'9ba7ab904f946639ee6a5a787ea884c47e8a7abf233030576f8262358db5bb9d',
 'scripts/run-ios-playback-smoke.py':'d4c243af1edccaf47b1f1fd95a5a436e3f491ae42520a80cf661ae59430347b9',
}
for file,digest in expected.items():
    assert hashlib.sha256(Path(file).read_bytes()).hexdigest()==digest,file
print('Reviewed production and driver file hashes match.')
