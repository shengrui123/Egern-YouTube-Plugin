import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../scripts/spotify.response.js', import.meta.url), 'utf8');
const handler = (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).default;
const varint = n => { const a = []; do { let b = n & 127; n >>>= 7; a.push(b | (n ? 128 : 0)); } while (n); return Buffer.from(a); };
const bytes = (field, value) => { const b = Buffer.from(value); return Buffer.concat([varint(field * 8 + 2), varint(b.length), b]); };
const bool = value => Buffer.from([16, value ? 1 : 0]);
const join = (...items) => Buffer.concat(items);
const entry = (key, value) => bytes(1, join(bytes(1, key), bytes(2, bool(value))));
// UcsResponseWrapper.success, including a configuration item and account attributes.
const assignment = bytes(3, join(bytes(1, join(bytes(1, 'other'), bytes(2, 'other'))), bytes(3, Buffer.from([8, 1]))));
const success = join(bytes(1, bytes(1, assignment)), bytes(3, join(entry('ads', true), entry('untouched', true))));
const fixture = bytes(1, success);

function parseFields(buffer) {
  let i = 0;
  const get = () => { let n = 0, shift = 0, b; do { b = buffer[i++]; if (b === undefined) throw Error('truncated'); n += (b & 127) * 2 ** shift; shift += 7; } while (b & 128); return n; };
  const fields = [];
  while (i < buffer.length) {
    const tag = get(), wire = tag & 7;
    if (wire === 2) { const n = get(); const value = buffer.subarray(i, i + n); i += n; fields.push([tag >>> 3, value]); }
    else if (wire === 0) fields.push([tag >>> 3, get()]);
    else throw Error('unexpected wire');
  }
  return fields;
}
const field = (data, n) => parseFields(data).find(([k]) => k === n)?.[1];
function attributes(body) {
  const account = field(field(body, 1), 3);
  return Object.fromEntries(parseFields(account).filter(([n]) => n === 1).map(([, data]) => {
    const key = Buffer.from(field(data, 1)).toString();
    const value = field(field(data, 2), 2);
    return [key, !!value];
  }));
}
async function run(body = fixture, env = {}) {
  return handler({env, request: {url: 'https://spclient.wg.spotify.com/user-customization-service/v1/customize'}, response: {status: 200, arrayBuffer: async () => body}});
}

test('customization response updates ads and experimental playback flags', async () => {
  const result = attributes((await run()).body);
  assert.equal(result.ads, false);
  assert.equal(result.untouched, true);
  assert.equal(result['on-demand'], true);
  assert.equal(result.shuffle, false);
  assert.equal(result['pick-and-shuffle'], false);
  assert.equal(result.unrestricted, true);
});

test('experimental playback can be disabled without changing ads handling', async () => {
  const result = attributes((await run(fixture, {experimentalPlayback: 'false'})).body);
  assert.equal(result.ads, false);
  assert.equal(result.untouched, true);
  assert.equal(result['on-demand'], undefined);
  assert.equal(result.shuffle, undefined);
  assert.equal(result.unrestricted, undefined);
});

test('malformed protobuf is returned unchanged', async () => {
  const malformed = Buffer.from([10, 255]);
  assert.deepEqual(Buffer.from((await run(malformed)).body), malformed);
});

test('bootstrap response receives the same playback flags', async () => {
  const bootstrap = bytes(2, bytes(1, bytes(1, fixture)));
  const result = await handler({env: {}, request: {url: 'https://spclient.wg.spotify.com/bootstrap/v1/bootstrap'}, response: {status: 200, arrayBuffer: async () => bootstrap}});
  const unwrapped = field(field(field(result.body, 2), 1), 1);
  const attrs = attributes(unwrapped);
  assert.equal(attrs.ads, false);
  assert.equal(attrs['on-demand'], true);
  assert.equal(attrs.unrestricted, true);
});

test('artist and album platform rewrites preserve the host and query', async () => {
  const moduleText = await readFile(new URL('../Spotify.RemoveAds.Egern.yaml', import.meta.url), 'utf8');
  const rule = moduleText.match(/- match: '([^']+album-entity-view[^']+)'\s+location: '([^']+)'/);
  assert.ok(rule, 'artist and album rewrite exists');
  const re = new RegExp(rule[1]);
  for (const [url, expected] of [
    ['https://spclient.wg.spotify.com/artistview/v1/artist/123?platform=iphone&market=TW', 'https://spclient.wg.spotify.com/artistview/v1/artist/123?platform=ipad&market=TW'],
    ['https://gew1-spclient.spotify.com/album-entity-view/v2/album/123?market=TW&platform=iphone', 'https://gew1-spclient.spotify.com/album-entity-view/v2/album/123?market=TW&platform=ipad'],
  ]) {
    assert.match(url, re);
    assert.equal(url.replace(re, rule[2]), expected);
  }
  for (const url of [
    'https://spclient.wg.spotify.com/artistview/v1/artist/123?platform=iphoneextra',
    'https://spclient.wg.spotify.com/other/123?platform=iphone',
    'https://evil.spotify.com/artistview/v1/artist/123?platform=iphone',
  ]) assert.doesNotMatch(url, re);
});
