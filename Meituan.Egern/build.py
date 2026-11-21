from pathlib import Path
import re,json,hashlib
root=Path(__file__).resolve().parent
src=(root/'upstream/MT.js').read_text()
logic=src[:src.index('(function () {')]
logic=logic.replace('const mtqxUrl = (typeof $request !== "undefined" && $request && $request.url) || "";','const mtqxUrl = ctx.request.url;')
original=src[src.index('    if (/\\/aggroup'):src.index('  } catch (e) {\n    changed = false;')]
script='''// Adapted from ZenmoFeiShi/Qx MT.js; fixed snapshot 2026-11-21.
// Source: https://github.com/ZenmoFeiShi/Qx/blob/main/MT.js
export default async function(ctx) {
  if (!ctx.request || !ctx.response || ctx.response.status !== 200) return;
  const body = await ctx.response.text();
  if (!body) return { body };
'''+logic+'''
  let obj;
  try { obj = JSON.parse(body); } catch { return { body }; }
  let changed = false;
  try {
'''+original+'''
  } catch { return { body }; }
  if (!changed) return { body };
  ctx.response.headers.delete('Content-Length');
  return { body: JSON.stringify(obj), headers: ctx.response.headers };
}
'''
(root/'scripts/meituan.response.js').write_text(script)
lines=['name: 美团去广告 · ZenmoFeiShi','description: 按 MT.snippet 完整转换，含开屏、购物车横幅、底栏及搜索推广清理，并保留 HTTPDNS 与 Shark 拦截。源标注美团 12.67.403；需信任 Egern CA，尚未真机验证。','author: TG@ZenMoFiShi；shengrui123（Egern 适配）','homepage: https://github.com/shengrui123/Egern-YouTube-Plugin','# Source: https://github.com/ZenmoFeiShi/Qx/blob/main/MT.snippet','# Snapshot: 2026-11-21; upstream update: 2026.10.25','rules:']
rew=[]; scripts=[];hosts=[];counts={}
for l in (root/'upstream/MT.snippet').read_text().splitlines():
 l=l.strip()
 if not l or l.startswith('#'):continue
 if l.startswith('hostname ='):hosts=[x.strip() for x in l.split('=',1)[1].split(',')];continue
 if ' url ' in l:
  pattern,action=l.split(' url ',1)
  if action=='reject':rew.append(pattern)
  elif action.startswith('script-response-body '):scripts.append(pattern)
  else:raise ValueError(l)
 else:
  t,m,p=[x.strip() for x in l.split(',')];assert p=='reject'
  kind={'host':'domain','host-wildcard':'domain_wildcard','ip-cidr':'ip_cidr','ip6-cidr':'ip_cidr6'}[t]
  counts[kind]=counts.get(kind,0)+1
  lines += [f'  - {kind}:',f"      match: '{m}'",'      policy: REJECT']
lines+=['url_rewrites:']
for p in rew:lines += [f"  - match: '{p}'",'    location: http://reject/']
lines+=['scriptings:']
for i,p in enumerate(scripts,1):
 lines+=['  - http_response:',f'      name: 美团响应净化 {i}',f"      match: '{p}'",'      script_url: https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/scripts/meituan.response.js','      body_required: true','      max_size: 4194304','      timeout: 10','      update_interval: 86400']
lines+=['mitm:','  hostnames:','    includes:']+['      - '+h for h in hosts]
(root.parent/'Meituan.RemoveAds.Egern.yaml').write_text('\n'.join(lines)+'\n')
meta={'source_version':'MT.snippet 2026.10.25; App 12.67.403','sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'upstream').iterdir()},'counts':counts,'rewrites':len(rew),'response_routes':len(scripts),'mitm_hosts':len(hosts)}
(root/'upstream.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print(meta)
