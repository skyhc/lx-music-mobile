#!/usr/bin/env python3
"""Reconstruct and verify Git objects only; never update refs or publish."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import sys
import urllib.request

REPO = 'skyhc/lx-music-mobile'
BASE = 'a9a683bae3da89276b3758cb1ff8e162c545a0a0'
BASE_TREE = '8d357ccff26dda0e9c9226fa060b80d645b122a4'
EXPECTED_TREE = 'b72699f133aa1e4d591d01ec82933a66f9f88a7b'
PARTS = (
    '5b56ffab17e4eb62cb031fbed687957308b92b0a4d376ff0677062ba947bdf60',
    '0ef417eae651e6df091bada14caefc7774b6a1db952717adcade1f269f2d614d',
    '5daf63fe2e901fd52d76a40d24fd266d1b1de65a958aa982400a2a76ee7a6b02',
    'ca656ddd6a7cead38120a50c8b9185ab7af1d02dd1379aae615930872f6dfa76',
    '6f946ba58fa45731adcd01d4efa6a41a74a7460d6c605318bbb7735482ce5044',
    '47ad3f15e701e2a4f94d7604931f22951bdd73655117174e47d29585ce5348ec',
    '8c26776edba8f7425eecff5c8d2f72141f2d8639617b3f0f5fcdb9cd0c4010a2',
)

def sha(data):
    return hashlib.sha256(data).hexdigest()


def blob_sha(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()


def apply(original, item):
    text = original.decode('utf-8')
    cursor = 0
    for start, end, replacement in item['ops']:
        assert isinstance(start, int) and isinstance(end, int)
        assert cursor <= start <= end <= len(text) and isinstance(replacement, str)
        cursor = end
    for start, end, replacement in reversed(item['ops']):
        text = text[:start] + replacement + text[end:]
    content = text.encode('utf-8')
    assert sha(content) == item['after'], 'Postimage mismatch: ' + item['path']
    return content


def request(endpoint, body):
    data = json.dumps(body, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request('https://api.github.com/repos/' + REPO + endpoint, data=data,
        headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json',
                 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28'})
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)


def main():
    local = len(sys.argv) == 4 and sys.argv[1] == '--local'
    folder = Path(sys.argv[2]) if local else Path(__file__).resolve().parent
    original_root = Path(sys.argv[3]) if local else None
    if not local:
        assert os.environ.get('GITHUB_REPOSITORY') == REPO
        tree = subprocess.check_output(['git', 'rev-parse', BASE + '^{tree}'], text=True).strip()
        assert tree == BASE_TREE, 'Base tree mismatch'
    items = []
    for index, digest in enumerate(PARTS, 1):
        data = (folder / ('ops-' + str(index) + '.json')).read_bytes()
        assert sha(data) == digest, 'Payload mismatch at ' + str(index)
        items.extend(json.loads(data))
    assert len(items) == 24 and len({x['path'] for x in items}) == 24
    generated = []
    for item in items:
        path = PurePosixPath(item['path'])
        assert not path.is_absolute() and '..' not in path.parts and '.git' not in path.parts
        assert item['mode'] in ('100644', '100755')
        if local:
            p = original_root / str(path)
            exists = p.is_file()
            original = p.read_bytes() if exists else b''
        else:
            found = subprocess.run(['git', 'show', BASE + ':' + str(path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            exists = found.returncode == 0
            original = found.stdout if exists else b''
        if item['before'] is None:
            assert not exists, 'New path already exists: ' + str(path)
        else:
            assert exists and sha(original) == item['before'], 'Base mismatch: ' + str(path)
        content = apply(original, item)
        generated.append((item, content, blob_sha(content)))
    elements = []
    report = []
    for item, content, expected_blob in generated:
        if not local:
            result = request('/git/blobs', {'content': content.decode('utf-8'), 'encoding': 'utf-8'})
            assert result['sha'] == expected_blob, 'Git blob mismatch: ' + item['path']
        elements.append({'path': item['path'], 'mode': item['mode'], 'type': 'blob', 'sha': expected_blob})
        report.append({'path': item['path'], 'sha256': sha(content), 'git_blob': expected_blob, 'bytes': len(content)})
    result_tree = None
    if not local:
        result_tree = request('/git/trees', {'base_tree': BASE_TREE, 'tree': elements})['sha']
        assert result_tree == EXPECTED_TREE, 'Complete application tree mismatch'
    output = {'repository': REPO, 'base': BASE, 'base_tree': BASE_TREE, 'expected_tree': EXPECTED_TREE,
              'tree': result_tree, 'files': report, 'mode': 'local-check' if local else 'objects-only',
              'refs_updated': False, 'build_or_release_started': False}
    destination = Path('ui-rework-result.json')
    destination.write_text(json.dumps(output, indent=2, ensure_ascii=False) + '\n')
    print('Verified', len(report), 'source files; tree:', result_tree or 'not uploaded (local check)')
    if not local:
        print('APP_TREE=' + result_tree)


if __name__ == '__main__':
    main()
