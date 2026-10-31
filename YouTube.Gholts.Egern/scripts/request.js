// Egern native API adapter. The bundled protobuf/UMP core comes from gholts/surge.
// See README.md and upstream/manifest.json for provenance and modifications.
export default async function(ctx) {
  const mode = "request";
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
(()=>{const e="YouTubeConfig";function t(t=e,r=1/0){const n=ctx.storage.get(t);if("string"==typeof n&&n.length>r)return{};try{const e=JSON.parse(n||"{}");return e&&"object"==typeof e&&!Array.isArray(e)?e:{}}catch{return{}}}function r(e){const t=new Uint8Array(e.reduce((e,t)=>e+t.length,0));let r=0;for(const n of e)t.set(n,r),r+=n.length;return t}function n(e,t){return e===t||e.length===t.length&&e.every((e,r)=>e===t[r])}function o(e){const t=[];do{t.push(e%128|(e>127?128:0)),e=Math.floor(e/128)}while(e);return new Uint8Array(t)}function i(e){const t=[];let r=0;function n(){let t=0,n=1;for(let o=0;o<5;o++){if(r>=e.length)throw new Error("Truncated protobuf varint");const o=e[r++];if(t+=(127&o)*n,!(128&o)){if(t>4294967295)throw new Error("Protobuf length/tag overflow");return t}n*=128}throw new Error("Invalid protobuf varint")}for(;r<e.length;){const o=r,i=n(),s=Math.floor(i/8),u=i%8;if(!s)throw new Error("Invalid protobuf field");let a=r;if(2===u){const e=n();a=r,r+=e}else if(1===u)r+=8;else if(5===u)r+=4;else{if(0!==u)throw new Error("Unsupported protobuf wire type "+u);{let t,n=0;do{if(r>=e.length||10===n++)throw new Error("Invalid protobuf integer");if(t=e[r++],10===n&&t>1)throw new Error("Protobuf integer overflow")}while(128&t)}}if(r>e.length)throw new Error("Truncated protobuf field");t.push({no:s,wire:u,data:e.subarray(a,r),raw:e.subarray(o,r)})}return t}function s(e){let t=0,r=1;for(const n of e)t+=(127&n)*r,r*=128;return t}function u(e={}){return"string"!=typeof argument||argument.includes("{{{")?e:{...e,...JSON.parse(argument)}}function a(e){return Object.entries(e.headers??{}).some(([e,t])=>"user-agent"===e.toLowerCase()&&/music/i.test(t))?"youtubeMusic":"youtube"}function f(e,t,r=!1){let n;for(const o of i(e))if(o.no===t&&2===o.wire){if(!r)return o.data;if(n)return;n=o.data}return n}function c(e){const t=e.replace(/[-_\s=]/g,e=>"-"===e?"+":"_"===e?"/":""),r=t.length%4==1,n=decodeBase64(r?t+"A":t);return r?n.subarray(0,-1):n}function h(e,t){const n=new Map(t?[[13,0],[14,2],[16,t.height],[21,t.height],[26,3],[30,0]]:[[16,4320],[26,1],[30,0]]),u=new Set,a=[];let f=!1;for(const t of i(e)){const e=0===t.wire?n.get(t.no):void 0;void 0!==e?(s(t.data)===e?a.push(t.raw):(a.push(o(8*t.no),o(e)),f=!0),u.add(t.no)):a.push(t.raw)}for(const[e,t]of n)u.has(e)||(a.push(o(8*e),o(t)),f=!0);return f?r(a):e}function l(e){const t=e.body;if(ArrayBuffer.isView(t))return new Uint8Array(t.buffer,t.byteOffset,t.byteLength);if(t?.length)throw new Error("YouTube requires binary-body-mode for request bodies");const r=Object.entries(e.headers??{}).find(([e])=>"content-length"===e.toLowerCase())?.[1];if(Number(r)>0)throw new Error("YouTube request body unavailable; requires-body must be enabled")}function g(){return{response:{status:200,headers:{"Content-Type":"application/x-protobuf"},body:new Uint8Array}}}!function(){let d;try{let y;if(d=request.url.split("?")[0],d.endsWith("/player/ad_break"))y=g();else if(d.endsWith("/log_event"))y=function(e){const r=Object.keys(e.headers??{}).filter(e=>"x-youtube-hot-hash-data"===e.toLowerCase());if(!r.length||t()[a(e)]?.clientKey)return;const n={...e.headers};for(const e of r)delete n[e];return{headers:n}}(request);else if(d.endsWith("/initplayback")){if("GET"!==request.method&&"HEAD"!==request.method){const s=l(request);if(y=function(r,o){if(void 0===r||0===r.length)return;const i=t()[o],s=f(r,3),u=s&&f(s,5);if(!u?.length)return g();for(const e of(a=i)?[a,...Array.isArray(a.previous)?a.previous.slice(0,3):[]].filter(e=>e&&"string"==typeof e.clientKey&&"string"==typeof e.encryptKey&&e.clientKey.length>0&&e.clientKey.length<=5500&&e.encryptKey.length>0&&e.encryptKey.length<=5500):[])try{if(n(u,c(e.encryptKey)))return}catch{}var a;return function(r,n){if(void 0===r||void 0===n)return;const o=t();if(!Object.hasOwn(o,r))return;const i=o[r],s=n;JSON.stringify(i)===JSON.stringify(s)&&(delete o[r],function(t,r=e){writeStorage(JSON.stringify(t),r)}(o))}(o,i),g()}(s,a(request)),!y&&s?.length&&!1!==u().autoHd){const e=function(e){const t=i(e),n=t.filter(e=>2===e.no&&2===e.wire);if(1!==n.length)return e;const s=n[0],u=h(s.data,void 0);return u===s.data?e:r(t.map(e=>e===s?r([o(18),o(u.length),u]):e.raw))}(s);e!==s&&(y={body:e})}}}else if(d.endsWith("/videoplayback")){const e=!1===u().autoHd?void 0:l(request);if(e?.length){const u=function(e,u){const a=i(e),c=function(e,r){try{const n=/[?&]id=([^&]+)/.exec(r);if(!n)return;const o=e.find(e=>5===e.no&&2===e.wire),u=o&&f(o.data,1);if(!u?.length)return;const a=t("YouTubeQuality",65536)?.[decodeURIComponent(n[1])];if(!function(e){const t=e;return!!(t&&"object"==typeof t&&!Array.isArray(t)&&Number.isInteger(t.height)&&t.height>0&&t.height<=2147483647&&Array.isArray(t.itags)&&t.itags.length>0&&t.itags.length<=256&&t.itags.every(e=>Number.isInteger(e)&&e>0&&e<=4294967295)&&new Set(t.itags).size===t.itags.length&&(void 0===t.premiumItags||Array.isArray(t.premiumItags)&&t.premiumItags.length<=t.itags.length&&new Set(t.premiumItags).size===t.premiumItags.length&&t.premiumItags.every(e=>t.itags.includes(e))))}(a))return;const c=[],h=[];for(const e of i(u)){if(6!==e.no||2!==e.wire)continue;const t=i(e.data).find(e=>1===e.no&&0===e.wire);if(!t)continue;const r=s(t.data);a.itags.includes(r)&&(c.push(e.data),a.premiumItags?.includes(r)&&h.push(e.data))}return c.length?{height:a.height,formats:h.length?h:c}:void 0}catch{return}}(a,u),l=a.filter(e=>17===e.no&&2===e.wire),g=c&&(l.length!==c.formats.length||l.some((e,t)=>!n(e.data,c.formats[t]))),d=[];let y=!1,p=!!g;for(const e of a)if(1===e.no&&2===e.wire){const t=h(e.data,c);t===e.data?d.push(e.raw):(d.push(o(10),o(t.length),t),p=!0),y=!0}else{if(g&&17===e.no&&2===e.wire)continue;d.push(e.raw)}if(!y){const e=h(new Uint8Array,c);d.push(o(10),o(e.length),e),p=!0}if(g)for(const e of c.formats)d.push(o(138),o(e.length),e);return p?r(d):e}(e,request.url);u!==e&&(y={body:u})}}done(y)}catch(e){console.log("YouTube request: "+e),d?.endsWith("/initplayback")?done(g()):done()}}()})();

    } catch (error) { console.log(`YouTube Egern: ${error}`); settle(fallback()); }
  });
}
