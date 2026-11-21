from pathlib import Path
root=Path(__file__).resolve().parent
source=(root/'upstream/NoAds.js').read_text()
wrapper='''// Egern adaptation of Yuheng0101/X ChinaMobile/NoAds.js.
// Fixed upstream SHA-256: 26d560b8c5fa038bc0f8f0ac751b1739e72b3c9d228a1bee064c420bfb5c76dd
// Original notice and bundled encryption implementation are preserved below.
export default async function(ctx) {
  if (!ctx.request || !ctx.response || ctx.response.status !== 200) return;
  const body = await ctx.response.text();
  if (!body) return { body };
  const stopped = {};
  let result;
  const done = (value) => { result = value; throw stopped; };
  try {
    runUpstream({ url: ctx.request.url }, {
      body,
      headers: { 'x-pen': ctx.response.headers.get('x-pen') || '' }
    }, done);
  } catch (error) {
    if (error !== stopped) {
      console.log('[ChinaMobile Yuheng] Processing failed; original response preserved.');
      return { body };
    }
  }
  if (!result || typeof result.body !== 'string' || !result.body) return { body };
  if (result.body === body) return { body };
  // Keep protocol headers including x-pen; remove a potentially stale length.
  ctx.response.headers.delete('Content-Length');
  return { body: result.body, headers: ctx.response.headers };
}
function runUpstream($request, $response, $done) {
'''
(root/'scripts/chinamobile.yuheng.response.js').write_text(wrapper+source+'\n}\n')
