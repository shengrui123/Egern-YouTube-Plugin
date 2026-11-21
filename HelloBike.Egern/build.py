from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
source=(root/'upstream/easybike-ad.js').read_text()
wrapper='''// ZenmoFeiShi/Qx easybike-ad.js fixed snapshot; native Egern adapter.
// Original source: https://github.com/ZenmoFeiShi/Qx/blob/main/easybike-ad.js
export default async function(ctx) {
  if (!ctx.request) return;
  const stage = ctx.env?.stage || 'response';
  const toHeaders = (headers) => {
    const out = {};
    for (const k of Object.keys(headers || {})) {
      if (typeof headers[k] !== 'function') out[k] = headers[k];
    }
    for (const k of ['action', 'key-version', 'fingerprint-hash']) {
      const v = headers?.get(k);
      if (v !== null && v !== undefined) out[k] = v;
    }
    return out;
  };
  // Egern exposes the request body on ctx.request in response scripts.
  // Pass it directly; do not invent a Quantumult X sessionIndex.
  const reqBody = stage === 'echo' ? '' : await ctx.request.text();
  const request = { url: ctx.request.url, method: ctx.request.method,
    headers: toHeaders(ctx.request.headers), body: reqBody };
  const resBody = stage === 'response' && ctx.response ? await ctx.response.text() : undefined;
  const response = stage === 'response' && ctx.response ? {
    statusCode: ctx.response.status, headers: toHeaders(ctx.response.headers), body: resBody
  } : undefined;
  const prefs = {
    valueForKey: key => ctx.storage.get('HelloBike.Egern.' + key),
    setValueForKey: (value, key) => { ctx.storage.set('HelloBike.Egern.' + key, value); return true; },
    removeValueForKey: key => { ctx.storage.delete('HelloBike.Egern.' + key); return true; }
  };
  const notify = (title, subtitle, body) => ctx.notify({ title, subtitle,
    body: body.replace('QX 本机', 'Egern 本机') });
  let result = {};
  try { runUpstream(request, response, prefs, notify, value => { result = value || {}; }); }
  catch { result = {}; }
  if (stage === 'echo') {
    const status = Number(/\\b(\\d{3})\\b/.exec(String(result.status))?.[1] || 503);
    return ctx.respond({ status, headers: result.headers || { 'Content-Type': 'application/json' },
      body: typeof result.body === 'string' ? result.body : '{}' });
  }
  if (stage === 'request') return { body: reqBody };
  if (typeof result.body !== 'string' || result.body === resBody) return { body: resBody };
  ctx.response.headers.delete('Content-Length');
  return { body: result.body, headers: ctx.response.headers };
}
function runUpstream($request, $response, $prefs, $notify, $done) {
'''
(root/'scripts/hellobike.response.js').write_text(wrapper+source+'\n}\n')
lines=['name: 哈啰净化 · ZenmoFeiShi','description: 完整适配 helloobike.snippet 2026-11-06，净化广告、推荐流、借钱入口、我的页与车主会员推广。动态密钥仅本机保存；需信任 Egern CA，尚未真机验证。','author: TG@ZenMoFiShi；shengrui123（Egern 适配）','homepage: https://github.com/shengrui123/Egern-YouTube-Plugin','# Source: https://github.com/ZenmoFeiShi/Qx/blob/main/helloobike.snippet','url_rewrites:']
scripts=[];hosts=[];rejects=[]
for l in (root/'upstream/helloobike.snippet').read_text().splitlines():
 l=l.strip()
 if not l or l.startswith('#'):continue
 if l.startswith('hostname ='):hosts=[x.strip() for x in l.split('=',1)[1].split(',')];continue
 pattern,action=l.split(' url ',1)
 if action=='reject-200':
  rejects.append(pattern);lines += [f"  - match: '{pattern}'",'    location: http://reject-200/']
 else:
  kind={'script-request-body':'request','script-response-body':'response','script-echo-response':'echo'}[action.split()[0]];scripts.append((pattern,kind))
lines+=['scriptings:']
for i,(pattern,kind) in enumerate(scripts,1):
 lines+=['  - '+('http_response:' if kind=='response' else 'http_request:'),f'      name: 哈啰 {kind} {i}',f"      match: '{pattern}'",'      script_url: https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/scripts/hellobike.response.js','      env:',f'        stage: {kind}','      body_required: true','      max_size: 4194304','      timeout: 15','      update_interval: 86400']
lines+=['mitm:','  hostnames:','    includes:']+['      - '+h for h in hosts]
(root.parent/'HelloBike.Clean.Egern.yaml').write_text('\n'.join(lines)+'\n')
meta={'source_update':'2026-11-06','snapshot':'2026-11-21','sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'upstream').iterdir()},'rejects':len(rejects),'script_routes':len(scripts),'mitm_hosts':len(hosts)}
(root/'upstream.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print(meta)
