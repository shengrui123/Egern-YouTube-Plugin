import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createCipheriv,createDecipheriv} from 'node:crypto';
const src=fs.readFileSync(new URL('./scripts/chinamobile.yuheng.response.js',import.meta.url),'utf8');
const {default:run}=await import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
const iv=Buffer.from('9791027341711819');
function crypt(text,pen,decrypt=false){
 const key=Buffer.from(pen===2?'GS7VelkJl5IT1uwQ':'UVic06tpXgMNiApm');
 const c=(decrypt?createDecipheriv:createCipheriv)('aes-128-cbc',key,iv);
 return Buffer.concat([c.update(text,decrypt?'base64':'utf8'),c.final()]).toString(decrypt?'utf8':'base64');
}
async function process(path,data,pen){
 const cipher=crypt(JSON.stringify(data),pen);
 const body=pen===1?JSON.stringify({body:cipher}):cipher;
 const headers=new Headers({'X-PEN':String(pen),'Content-Length':String(body.length),'X-Keep':'yes'});
 const out=await run({request:{url:'https://client.app.coc.10086.cn/biz-orange/DN/'+path},response:{status:200,headers,text:async()=>body}});
 assert.ok(out?.body);assert.equal(headers.get('X-Keep'),'yes');assert.equal(headers.get('x-pen'),String(pen));
 const enc=pen===1?JSON.parse(out.body).body:out.body;
 return JSON.parse(crypt(enc,pen,true));
}
for(const pen of [1,2]){
 const data={retCode:'000000',rspBody:{startImgurl:'ad.jpg',actionUrl:'https://ad.test',riskSwitch:'0',mZoneSwitchState:'1',appletLogSwitch:'1',gsmIsShow:'1',sdkAdWaitTime:5,account:'keep'}};
 const out=await process('init/startInit',data,pen);
 assert.deepEqual(out.rspBody,{startImgurl:'',actionUrl:'',riskSwitch:'1',mZoneSwitchState:'0',appletLogSwitch:'0',gsmIsShow:'0',sdkAdWaitTime:-1,account:'keep'});
 assert.deepEqual((await process('newTopPullSecond/getNewTopPullList',{retCode:'000000',rspBody:{areaList:[{ad:1}],keep:1}},pen)).rspBody,{areaList:[],keep:1});
 assert.deepEqual((await process('emotionMarket/getEmotionMarketNew',{retCode:'000000',rspBody:{pageList:[{ad:1}],keep:1}},pen)).rspBody,{pageList:[],keep:1});
 assert.deepEqual((await process('friendShake/getShakeList',{retCode:'000000',rspBody:{friendShakeDbs:[1],keep:1}},pen)).rspBody,{friendShakeDbs:[],keep:1});
 const areas={retCode:'000000',rspBody:{areaList:[{areaId:'20230710006',moduleList:[{moduleId:'2'}]},{areaId:'normal',moduleList:[{moduleId:'1'},{moduleId:'2'}]}]}};
 const home=await process('homeArea/getTopAreaList',areas,pen);
 assert.deepEqual(home.rspBody.areaList[0].moduleList,[]);
 assert.deepEqual(home.rspBody.areaList[1].moduleList,[{moduleId:'2'}]);
 const nav=await process('navigation/getNavigationNewInfo',{retCode:'000000',rspBody:{classificationList:[{bannerList:[1],keep:1}]}},pen);
 assert.deepEqual(nav.rspBody.classificationList,[{bannerList:[],keep:1}]);
 const failed={retCode:'999999',rspBody:{startImgurl:'keep'}};
 assert.deepEqual(await process('init/startInit',failed,pen),failed);
 console.log(`x-pen ${pen}: encrypted splash, pull-down, floating ad, popup, homepage areas, navigation and error response passed`);
}
for(const body of ['invalid','{}','']){
 const out=await run({request:{url:'https://client.app.coc.10086.cn/biz-orange/DN/init/startInit'},response:{status:200,headers:new Headers({'x-pen':'2'}),text:async()=>body}});
 assert.equal(out.body,body);
}
let read=false;
assert.equal(await run({request:{url:'x'},response:{status:503,text:async()=>{read=true}}}),undefined);
assert.equal(read,false);
console.log('Malformed, empty and non-200 response checks passed');
