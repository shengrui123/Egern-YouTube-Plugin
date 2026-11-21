from pathlib import Path
import hashlib,json,re
root=Path(__file__).resolve().parent
src=(root/'upstream/weread.js').read_text()
logic=src[:src.index('if (resp) $done')].replace('let url = $request.url;', 'let url = ctx.request.url;').replace('$response.body','body')
script='''// Adapted from Maasea/sgmodule Script/WeRead/weread.js, snapshot 2026-11-22.
// Source: https://github.com/Maasea/sgmodule/blob/master/Script/WeRead/weread.js
export default async function(ctx) {
  if (!ctx.request || !ctx.response || ctx.response.status !== 200) return;
  const body = await ctx.response.text();
  try {
'''+logic+'''
    if (!resp) return { body };
    const output = JSON.stringify(resp);
    ctx.response.headers.delete('Content-Length');
    return { body: output, headers: ctx.response.headers };
  } catch { return { body }; }
}
'''
(root/'scripts/weread.response.js').write_text(script)
sg=(root/'upstream/WeRead.sgmodule').read_text();pattern=re.search(r',pattern=(.*?),requires-body=',sg)[1]
yaml='''name: 微信读书精简 · Maasea
description: 去除底栏红点、阅读页小圈子及评论分享数字，隐藏个人页部分提示。按 Maasea 原模组启用范围转换；不是通用广告拦截。需信任 Egern CA，尚未真机验证。
author: Maasea；shengrui123（Egern 适配）
homepage: https://github.com/shengrui123/Egern-YouTube-Plugin
# Source: https://github.com/Maasea/sgmodule/blob/master/WeRead.sgmodule
# 原模组未启用脚本中的 discoverfeed/new、discoverfeed/get；此处保持一致。
scriptings:
  - http_response:
      name: 微信读书响应精简
      match: 'PATTERN'
      script_url: https://raw.githubusercontent.com/shengrui123/Egern-YouTube-Plugin/main/scripts/weread.response.js
      body_required: true
      max_size: 4194304
      timeout: 10
      update_interval: 86400
mitm:
  hostnames:
    includes:
      - i.weread.qq.com
'''.replace('PATTERN',pattern)
(root.parent/'WeRead.Clean.Egern.yaml').write_text(yaml)
meta={'snapshot':'2026-11-22','sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'upstream').iterdir()},'pattern':pattern,'disabled_upstream_script_branches':['discoverfeed/new','discoverfeed/get']}
(root/'upstream.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print('Built native script and YAML; source regex preserved.')
