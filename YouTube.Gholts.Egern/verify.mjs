import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createCipheriv, createDecipheriv, createHmac} from 'node:crypto';
import {gzipSync, gunzipSync} from 'node:zlib';

const dir = await mkdtemp(join(tmpdir(), 'gholts-egern-'));
const mods = {};
for (const name of ['request','response','key','ump']) {
  const source = await readFile(new URL(`scripts/${name}.js`, import.meta.url), 'utf8');
  assert(!/\$(request|response|argument|done|persistentStore)\b/.test(source));
  const file = join(dir, name + '.mjs');
  await writeFile(file, source);
  mods[name] = (await import(pathToFileURL(file).href)).default;
}
const cat = (...parts) => new Uint8Array(Buffer.concat(parts.map(x => Buffer.from(x))));
const vint = n => { const out=[]; do {out.push(n % 128 | (n>127?128:0)); n=Math.floor(n/128);} while(n); return Uint8Array.from(out); };
const field = (n, data) => cat(vint(n*8+2), vint(data.length), data);
const uint = (n,v) => cat(vint(n*8),vint(v));
function parse(data) {
  let pos=0;
  const read=()=>{let n=0,m=1,b; do {b=data[pos++];n+=(b&127)*m;m*=128;}while(b&128); return n;};
  const fields=[];
  while(pos<data.length){const tag=read(),wire=tag%8,no=Math.floor(tag/8);if(wire===2){const len=read();fields.push({no,data:data.slice(pos,pos+len)});pos+=len;}else if(wire===0)fields.push({no,value:read()});else throw Error('fixture wire');}
  return fields;
}
const store = new Map();
function headers(values={}) {
  const h={...values};
  Object.defineProperty(h,'getAll',{value:name=>Object.entries(values).filter(([k])=>k.toLowerCase()===name.toLowerCase()).flatMap(([,v])=>Array.isArray(v)?v:[v])});
  return h;
}
function message(body, values={}) {
  let consumed=false;
  return {body:body==null?null:{},headers:headers(values),arrayBuffer:async()=>{
    assert(!consumed,'body consumed twice');consumed=true;
    return Uint8Array.from(body).buffer;
  }};
}
function context(url, body, responseBody, env={}, reqHeaders={}, respHeaders={}) {
  return {env,request:{url,method:'POST',...message(body,reqHeaders)},
    response:{status:200,...message(responseBody,respHeaders)},
    storage:{get:k=>store.get(k)??null,set:(k,v)=>{store.set(k,v);},delete:k=>store.delete(k)},
    compress:{gzip:async data=>new Uint8Array(gzipSync(data)),gunzip:async data=>new Uint8Array(gunzipSync(data))},
    respond:r=>({direct:r})};
}
const api='https://youtubei.googleapis.com/youtubei/v1/';
let result=await mods.request(context(api+'player/ad_break'));
assert.equal(result.direct.status,200); assert.equal(result.direct.body.length,0);
result=await mods.request(context(api+'log_event',null,null,{}, {'X-Youtube-Hot-Hash-Data':'hash',Keep:'yes'}));
assert.deepEqual(result.headers,{Keep:'yes'});

// Capture two successive key versions, preserving the previous one.
const key=Uint8Array.from({length:32},(_,i)=>i+1), enc=Uint8Array.of(4,5,6);
const wrapKeys=(a,b)=>[146311580,138536474,7,16,1].reduce((data,n)=>field(n,data),cat(field(1,a),field(2,b)));
await mods.key(context(api+'config',null,wrapKeys(key,enc)));
assert.equal(JSON.parse(store.get('YouTubeConfig')).youtube.clientKey,Buffer.from(key).toString('base64'));
await mods.key(context(api+'config',null,wrapKeys(key,Uint8Array.of(7,8,9))));
assert.equal(JSON.parse(store.get('YouTubeConfig')).youtube.previous.length,1);
assert.equal(await mods.request(context(api+'log_event',null,null,{}, {'X-Youtube-Hot-Hash-Data':'hash'})),undefined);
const init=cat(field(2,new Uint8Array()),field(3,field(5,Uint8Array.of(7,8,9))));
result=await mods.request(context('https://rr1.googlevideo.com/initplayback?x=1',init));
assert(result.body.length>init.length); assert(!result.direct);
result=await mods.request(context('https://rr1.googlevideo.com/videoplayback',Uint8Array.of(255),null,{auto_hd:'false'}));
assert.equal(result,undefined);
result=await mods.request(context('https://rr1.googlevideo.com/videoplayback',field(1,new Uint8Array())));
assert(result.body.length>2);

// A synthetic protobuf player: remove ads while retaining unknown fields.
const unknown=field(999,Uint8Array.of(1,2,3));
const player=cat(field(7,Uint8Array.of(1)),field(68,Uint8Array.of(2)),unknown);
result=await mods.response(context(api+'player',null,player,{}, {}, {'Content-Type':'application/x-protobuf','Content-Length':'99','Set-Cookie':['a=1','b=2']}));
assert(!parse(result.body).some(f=>f.no===7||f.no===68));
assert.deepEqual(parse(result.body).find(f=>f.no===999).data,Uint8Array.of(1,2,3));
assert(!('Content-Length' in result.headers));assert.deepEqual(result.headers['Set-Cookie'],['a=1','b=2']);
// Truncated protobuf passes through unchanged.
result=await mods.response(context(api+'player',null,Uint8Array.of(255)));
assert.deepEqual(result.body,Uint8Array.of(255));

// Real AES-CTR/HMAC UMP fixture, with native Egern gzip calls mocked by zlib.
const uv=n=>{const out=[];const size=n<128?1:n<16384?2:n<2097152?3:n<268435456?4:5;if(size===1)return Uint8Array.of(n);out.push(size===5?240:256-(256>>(size-1))|n&((1<<(8-size))-1));for(let i=1,b=size===5?0:8-size;i<size;i++,b+=8)out.push(Math.floor(n/2**b)&255);return Uint8Array.from(out);};
const part=(type,data)=>cat(uv(type),uv(data.length),data);
const iv=Uint8Array.from({length:16},(_,i)=>i+20);
const crypt=(data,decrypt=false)=>{const c=(decrypt?createDecipheriv:createCipheriv)('aes-128-ctr',key.slice(0,16),iv);return cat(c.update(data),c.final());};
const mac=data=>new Uint8Array(createHmac('sha256',key.slice(16)).update(data).update(iv).digest());
const payload=field(4,field(2,player));
const encrypted=crypt(gzipSync(payload));
const envelope=cat(field(1,encrypted),field(2,mac(encrypted)),field(3,iv),uint(4,1));
const ump=cat(part(10,uint(1,25)),part(11,envelope));
let gzipCalls=0,gunzipCalls=0;
const ctx=context('https://rr1.googlevideo.com/initplayback',null,ump,{}, {}, {'Content-Type':'application/vnd.yt-ump'});
ctx.compress={gzip:async d=>{gzipCalls++;return new Uint8Array(gzipSync(d));},gunzip:async d=>{gunzipCalls++;return new Uint8Array(gunzipSync(d));}};
result=await mods.ump(ctx);
assert.equal(gzipCalls,1);assert.equal(gunzipCalls,1);assert.notDeepEqual(result.body,ump);
function readParts(data){let p=0;const read=()=>{const b=data[p++];let size=5;for(let i=1;i<5;i++)if(!(b&128>>(i-1))){size=i;break;}let shift=size===5?0:8-size,n=size===5?0:b&((1<<shift)-1);for(let i=1;i<size;i++,shift+=8)n+=data[p++]*2**shift;return n;};const out=[];while(p<data.length){const type=read(),len=read();out.push({type,data:data.slice(p,p+len)});p+=len;}return out;}
const changed=new Map(parse(readParts(result.body)[1].data).map(f=>[f.no,f.data??f.value]));
assert.deepEqual(mac(changed.get(1)),changed.get(2));
const inner=parse(gunzipSync(crypt(changed.get(1),true)))[0].data;
const changedPlayer=parse(inner)[0].data;
assert(!parse(changedPlayer).some(f=>f.no===7||f.no===68));
assert.deepEqual(Array.from(parse(changedPlayer).find(f=>f.no===999).data),[1,2,3]);
console.log('PASS: 4 native modules; ad response; log headers; key capture/rotation; init/quality requests; protobuf ads and unknown fields; malformed-body fallback; encrypted gzip UMP round-trip and HMAC.');
export const verificationPassed=true;
