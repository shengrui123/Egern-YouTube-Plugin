// Egern native API adapter. The bundled protobuf/UMP core comes from gholts/surge.
// See README.md and upstream/manifest.json for provenance and modifications.
export default async function(ctx) {
  const mode = "key";
  const responseStage = mode !== 'request';
  const defaults = {block_upload:true, block_shorts:false, auto_hd:true,
    block_games:true, block_vertical_live:false, jump_ahead:true,
    block_store:true, block_ai:true, on_the_go:true};
  const names = {block_upload:'blockUpload', block_shorts:'blockShorts', auto_hd:'autoHd',
    block_games:'blockGames', block_vertical_live:'blockVerticalLive', jump_ahead:'jumpAhead',
    block_store:'blockStore', block_ai:'blockAi', on_the_go:'onTheGo'};
  const options = {};
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = ctx.env?.[key];
    options[names[key]] = value === 'false' ? false : value === 'true' ? true : fallback;
  }
  const argument = JSON.stringify(options);
  const original = responseStage ? ctx.response : ctx.request;
  if (!original) return;
  // Avoid consuming bodies on routes that do not need them.
  const path = ctx.request.url.split('?')[0];
  if (!responseStage && path.endsWith('/videoplayback') && !options.autoHd) return;
  const needsBody = responseStage || /\/(initplayback|videoplayback)$/.test(path);
  const bytes = needsBody && original.body != null
    ? new Uint8Array(await original.arrayBuffer()) : undefined;
  // Egern Headers supports enumerable, case-insensitive properties and getAll().
  const plainHeaders = headers => {
    const out = {};
    for (const key of Object.keys(headers ?? {})) {
      if (typeof headers[key] === 'function') continue;
      const values = headers.getAll(key);
      if (values.length) out[key] = values.length === 1 ? values[0] : values;
    }
    return out;
  };
  const request = {url:ctx.request.url, method:ctx.request.method,
    headers:plainHeaders(ctx.request.headers)};
  const response = responseStage ? {status:ctx.response.status,
    headers:plainHeaders(ctx.response.headers), body:bytes} : undefined;
  if (!responseStage) request.body = bytes;
  const fallback = () => bytes === undefined ? undefined : {body:bytes};
  // Local helpers avoid relying on new Uint8Array base64 methods in the JS engine.
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const decodeBase64 = value => {
    const s = String(value).replace(/\s/g, '');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.replace(/=+$/, '').length % 4 === 1)
      throw new Error('Invalid base64');
    const raw = s.replace(/=+$/, '');
    const out = new Uint8Array(Math.floor(raw.length * 6 / 8));
    let bits = 0, count = 0, index = 0;
    for (const ch of raw) {
      bits = (bits << 6) | alphabet.indexOf(ch); count += 6;
      if (count >= 8) { count -= 8; out[index++] = (bits >>> count) & 255; }
    }
    return out;
  };
  const encodeBase64 = data => {
    let result = '';
    for (let i = 0; i < data.length; i += 3) {
      const n = (data[i] << 16) | ((data[i+1] ?? 0) << 8) | (data[i+2] ?? 0);
      result += alphabet[(n >>> 18) & 63] + alphabet[(n >>> 12) & 63]
        + (i+1 < data.length ? alphabet[(n >>> 6) & 63] : '=')
        + (i+2 < data.length ? alphabet[n & 63] : '=');
    }
    return result;
  };
  return await new Promise(resolve => {
    let finished = false;
    const settle = result => {
      if (finished) return;
      finished = true; clearTimeout(timer); resolve(result);
    };
    const timer = setTimeout(() => settle(fallback()), 28000);
    const done = result => {
      try {
        if (result == null) return settle(fallback());
        const direct = !responseStage && result.response;
        const value = direct || result;
        const out = {};
        for (const key of (responseStage || direct ? ['status','headers'] : ['url','method','headers']))
          if (value[key] !== undefined) out[key] = value[key];
        if (value.body !== undefined) out.body = value.body;
        else if (!direct && bytes !== undefined) out.body = bytes;
        if (value.body !== undefined) {
          out.headers = {...(value.headers ?? (responseStage ? response.headers : request.headers))};
          for (const key of Object.keys(out.headers))
            if (/^(content-length|content-encoding|transfer-encoding)$/i.test(key)) delete out.headers[key];
        }
        settle(direct ? ctx.respond({status:200, ...out}) : out);
      } catch (error) { console.log(`YouTube Egern: ${error}`); settle(fallback()); }
    };
    try {
      const writeStorage = (value, key) => {
      if (finished) return false;
      ctx.storage.set(key, String(value)); return true;
    };
(()=>{const e="YouTubeConfig";function t(e,t,r=!1){let n;for(const o of function(e){const t=[];let r=0;function n(){let t=0,n=1;for(let o=0;o<5;o++){if(r>=e.length)throw new Error("Truncated protobuf varint");const o=e[r++];if(t+=(127&o)*n,!(128&o)){if(t>4294967295)throw new Error("Protobuf length/tag overflow");return t}n*=128}throw new Error("Invalid protobuf varint")}for(;r<e.length;){const o=r,i=n(),l=Math.floor(i/8),s=i%8;if(!l)throw new Error("Invalid protobuf field");let c=r;if(2===s){const e=n();c=r,r+=e}else if(1===s)r+=8;else if(5===s)r+=4;else{if(0!==s)throw new Error("Unsupported protobuf wire type "+s);{let t,n=0;do{if(r>=e.length||10===n++)throw new Error("Invalid protobuf integer");if(t=e[r++],10===n&&t>1)throw new Error("Protobuf integer overflow")}while(128&t)}}if(r>e.length)throw new Error("Truncated protobuf field");t.push({no:l,wire:s,data:e.subarray(c,r),raw:e.subarray(o,r)})}return t}(e))if(o.no===t&&2===o.wire){if(!r)return o.data;if(n)return;n=o.data}return n}!function(){try{const o=request.url.split("?")[0].split("/youtubei/v1/")[1];if("config"!==o&&"log_event"!==o||!response.body?.length)return done();let i=response.body;for(const e of[1,16,7,138536474,146311580])if(i=t(i,e,!0),!i)return done();const l=t(i,1,!0),s=t(i,2,!0);if(l?.length&&s?.length&&l.length<=4096&&s.length<=4096){const t=(n=request,Object.entries(n.headers??{}).some(([e,t])=>"user-agent"===e.toLowerCase()&&/music/i.test(t))?"youtubeMusic":"youtube"),o=function(t=e,r=1/0){const n=ctx.storage.get(t);if("string"==typeof n&&n.length>r)return{};try{const e=JSON.parse(n||"{}");return e&&"object"==typeof e&&!Array.isArray(e)?e:{}}catch{return{}}}(),i={clientKey:encodeBase64(l),encryptKey:encodeBase64(s)};if(o[t]?.clientKey!==i.clientKey||o[t]?.encryptKey!==i.encryptKey){const n=(r=o[t],r?[r,...Array.isArray(r.previous)?r.previous.slice(0,3):[]].filter(e=>e&&"string"==typeof e.clientKey&&"string"==typeof e.encryptKey&&e.clientKey.length>0&&e.clientKey.length<=5500&&e.encryptKey.length>0&&e.encryptKey.length<=5500):[]).filter(e=>e.clientKey!==i.clientKey||e.encryptKey!==i.encryptKey).slice(0,3).map(({clientKey:e,encryptKey:t})=>({clientKey:e,encryptKey:t}));n.length&&(i.previous=n),o[t]=i,function(t,r=e){return writeStorage(JSON.stringify(t),r)}(o)||console.log("YouTube key write failed")}}done()}catch(e){console.log("YouTube keys: "+e),done()}var r,n}()})();

    } catch (error) { console.log(`YouTube Egern: ${error}`); settle(fallback()); }
  });
}
