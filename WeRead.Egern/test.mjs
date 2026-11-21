import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const src=read('./upstream/weread.js');
const {default:run}=await import('data:text/javascript;base64,'+Buffer.from(read('./scripts/weread.response.js')).toString('base64'));
const now=1795276800000;class FixedDate extends Date {constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}}
const RealDate=globalThis.Date;
const fixtures=[
 ['book/readingstat',{x:1},x=>{assert.equal(x.markedStatus,1);assert.deepEqual(x.readingUsers,[]);assert.equal(x.readingCount,0)}],
 ['book/readingStat',{x:1},x=>{assert.deepEqual(x.mixReadingUsers,[]);assert.equal(x.friendReadingCount,0)}],
 ['book/chapterReview',{x:1},x=>assert.deepEqual(x,{synckey:0,shareCount:0})],
 ['groups/readerEntrance',{x:1},x=>assert.deepEqual(x,{synckey:now/1000,hasGroup:0})],
 ['review/list',{reviews:[1]},x=>{assert.deepEqual(x.reviews,[]);assert.equal(x.totalCount,0)}],
 ['user/profile',{showMedal:1,showReview:1,canExchangeDay:1,exchangeMsg:'ad',username:'keep'},x=>assert.deepEqual(x,{showMedal:0,showReview:0,canExchangeDay:0,exchangeMsg:'',username:'keep'})],
 ['mobileSync',{notifCount:5,orders:'keep'},x=>{assert.equal(x.notifCount,0);assert.equal(x.discover,false);assert.equal(x.orders,'keep')}]
];
function ctx(path,body,status=200){return {request:{url:'https://i.weread.qq.com/'+path+'?v=1'},response:{status,headers:new Headers({'Content-Length':String(body.length),'X-Keep':'yes'}),text:async()=>body}};}
try{
 globalThis.Date=FixedDate;
 for(const [path,obj,check] of fixtures){const body=JSON.stringify(obj);const c=ctx(path,body);let expected;
 vm.runInNewContext(src,{$request:{url:c.request.url},$response:{body},$done:r=>{expected=r},Date:FixedDate});
 const result=await run(c);assert.equal(result.body,expected.body);check(JSON.parse(result.body));assert.equal(c.response.headers.get('Content-Length'),null);assert.equal(c.response.headers.get('X-Keep'),'yes');}
 for(const path of ['user/profile','mobileSync'])for(const bad of ['invalid','null',''])assert.equal((await run(ctx(path,bad))).body,bad);
 assert.equal((await run(ctx('unknown','{"keep":true}'))).body,'{"keep":true}');
 assert.equal(await run(ctx('mobileSync','bad',503)),undefined);
}finally{globalThis.Date=RealDate;}
console.log('Passed: all 7 enabled endpoint variants match upstream; field checks, unrelated fields, malformed input, unknown endpoint, non-200 response and headers.');
