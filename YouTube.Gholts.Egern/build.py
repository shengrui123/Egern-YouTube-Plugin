"""Build native Egern entry points from the pinned upstream snapshots."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
COMMIT = '4ac19cee13ffa9a998694d228a47bed19c4bcced'
template = (ROOT / 'adapter.template.js').read_text()
manifest = {'repository': 'https://github.com/gholts/surge', 'commit': COMMIT,
            'converted_at': '2026-10-31', 'sha256': {}}
for mode in ['request', 'response', 'key', 'ump']:
    source = (ROOT / 'upstream' / (mode + '.js')).read_text()
    manifest['sha256'][mode + '.js'] = hashlib.sha256(source.encode()).hexdigest()
    source = source.replace('Uint8Array.fromBase64(', 'decodeBase64(')
    if mode == 'key':
        assert 'l.toBase64()' in source and 's.toBase64()' in source
        source = source.replace('l.toBase64()', 'encodeBase64(l)').replace('s.toBase64()', 'encodeBase64(s)')
    if mode == 'ump':
        # CompressionStream is not required: use the documented Egern compressor.
        start = source.index('async function ag(')
        end = source.index('!async function()', start)
        source = source[:start] + '''async function ag(data, decompress) {
          const result = await ctx.compress[decompress ? 'gunzip' : 'gzip'](data);
          if (!(result instanceof Uint8Array)) throw new Error('UMP gzip operation failed');
          if (decompress && result.length > 16777216) throw new Error('UMP decompression exceeds 16 MiB');
          return result;
        }''' + source[end:]
    source = source.replace('$persistentStore.read(', 'ctx.storage.get(')
    # Surge write(value, key) returns boolean, Egern set(key, value) returns void.
    source = source.replace('$persistentStore.write(', 'writeStorage(')
    source = re.sub(r'\$(request|response|argument|done)\b', r'\1', source)
    assert not re.search(r'\$(request|response|argument|done|persistentStore)\b', source)
    source = '''const writeStorage = (value, key) => {
      if (finished) return false;
      ctx.storage.set(key, String(value)); return true;
    };\n''' + source
    built = template.replace('__MODE__', json.dumps(mode)).replace('__UPSTREAM__', source)
    (ROOT / 'scripts' / (mode + '.js')).write_text(built)
(ROOT / 'upstream' / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Built four Egern scripts from', COMMIT)
