import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const upstream=read('./upstream/MT.js');
const {default:run}=await import('data:text/javascript;base64,'+Buffer.from(read('./scripts/meituan.response.js')).toString('base64'));
const fixtures=[
 ['https://apimobile.meituan.com/aggroup/indexTab',{data:{resource:{tabArea:['homepage','video','xiaotuan','mine','other'].map(tabName=>({tabName}))}}},x=>assert.deepEqual(x.data.resource.tabArea.map(t=>t.tabName),['homepage','mine','other'])],
 ['https://feedguess.meituan.com/lycoris/scene/gwc_feed1_2265?x=1',{data:[1],keep:1},x=>{assert.deepEqual(x.data,[]);assert.equal(x.ext.forbidByExp,true);assert.equal(x.keep,1)}],
 ['https://feedguess.meituan.com/lycoris/scene/personalcenter_2154',{data:[1]},x=>assert.equal(x.bottom,true)],
 ['https://mt-personalcenter.meituan.com/usercenter/display',{children:[{name:'mine_cross_recommend'},{name:'orders'}]},x=>assert.deepEqual(x.children,[{name:'orders'}])],
 ['https://apimobile.meituan.com/group/v1/deal/searchpage/defaultword',{searchIntroduceResponse:{defaultWordRes:{defaultWordItems:[1]},HotWordInfos:[2],keep:1}},x=>assert.deepEqual(x.searchIntroduceResponse,{defaultWordRes:{defaultWordItems:[]},HotWordInfos:[],keep:1})],
 ['https://apimobile.meituan.com/group/v1/deal/searchpage/hotword/city/divide/hotrecommend/',{data:{segmentsV2:[{hotwordSegments:[{pageName:'EntranceHotwordsV2Hotwords'},{pageName:'keep'}]},{hotwordSegments:[{pageName:'EntranceHotwordsV2ContentCard'}]},{keep:1}],aiSearchBubble:{bubbleTexts:[1]}}},x=>{assert.equal(x.data.segmentsV2.length,2);assert.deepEqual(x.data.segmentsV2[0].hotwordSegments,[{pageName:'keep'}]);assert.deepEqual(x.data.aiSearchBubble.bubbleTexts,[])}],
 ['https://assistify.meituan.com/assistant/getAppClientHornConfig',{data:JSON.stringify({skills:{ad:1},keep:1})},x=>assert.deepEqual(JSON.parse(x.data),{skills:{},keep:1})],
 ['https://mop.meituan.com/mop/entry/shoppingCartEntry',{resourcesMap:{topBannerArea:[1],orders:[2]},data:{resource:{topBannerArea:[3]}}},x=>{assert.deepEqual(x.resourcesMap,{topBannerArea:[],orders:[2]});assert.deepEqual(x.data.resource.topBannerArea,[])}],
 ['https://mop.meituan.com/api/entryModule/startupPicture',{resource:{startupPicArea:[1],keep:[2]},data:{resourcesMap:{startupPicArea:[3]}}},x=>{assert.deepEqual(x.resource,{startupPicArea:[],keep:[2]});assert.deepEqual(x.data.resourcesMap.startupPicArea,[])}]
];
async function compare(url,body,check){
 let expected;
 vm.runInNewContext(upstream,{$request:{url},$response:{body},$done:v=>{expected=v}},{timeout:1000});
 const headers=new Headers({'Content-Length':String(body.length),'X-Keep':'yes'});
 const actual=await run({request:{url},response:{status:200,headers,text:async()=>body}});
 const wanted=expected.body??body;
 assert.equal(actual.body,wanted);
 assert.equal(headers.get('X-Keep'),'yes');
 if(wanted!==body)assert.equal(headers.get('Content-Length'),null);
 if(check)check(JSON.parse(actual.body));
}
for(const [url,input,check] of fixtures){
 await compare(url,JSON.stringify(input),check);
 for(const body of ['{broken','null','[]','{}','',JSON.stringify({data:'{broken'})]) await compare(url,body);
}
await compare(fixtures[0][0],JSON.stringify({data:{resource:{tabArea:[{tabName:'video'}]}}}),x=>assert.equal(x.data.resource.tabArea.length,1));
let readBody=false;
assert.equal(await run({request:{url:fixtures[0][0]},response:{status:500,text:async()=>{readBody=true}}}),undefined);
assert.equal(readBody,false);
console.log('Passed: 9 positive fixtures, 54 malformed/empty/schema cases, tab safety guard, non-200 passthrough, upstream parity and header preservation.');
