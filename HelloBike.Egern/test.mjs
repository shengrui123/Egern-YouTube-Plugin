import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createCipheriv,createDecipheriv,createHash} from 'node:crypto';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const src=read('./upstream/easybike-ad.js');
const {default:run}=await import('data:text/javascript;base64,'+Buffer.from(read('./scripts/hellobike.response.js')).toString('base64'));
const STATIC='0199bec97dfa5e0d',DYNAMIC='1234567890abcdef';
function cipher(text,key=STATIC,decrypt=false){const k=Buffer.from(key);const c=(decrypt?createDecipheriv:createCipheriv)('aes-128-cbc',k,k);return Buffer.concat([c.update(text,decrypt?'base64':'utf8'),c.final()]).toString(decrypt?'utf8':'base64');}
const saved=new Map();const notifications=[];
const storage={get:k=>saved.get(k)??null,set:(k,v)=>saved.set(k,v),delete:k=>saved.delete(k)};
function context(url,reqBody,resBody,stage='response',headers={},status=200){return {env:{stage},storage,notify:x=>notifications.push(x),respond:x=>({synthetic:x}),request:{url,method:'POST',headers:new Headers(headers),text:async()=>reqBody},response:stage==='response'?{status,headers:new Headers({'Content-Length':String(resBody.length)}),text:async()=>resBody}:undefined};}
function original(url,req,res,headers={}){let result;vm.runInNewContext(src,{$request:{url,method:'POST',headers,body:req},$response:{statusCode:200,headers:{},body:res},$done:x=>{result=x},$prefs:{valueForKey:()=>null,setValueForKey:()=>true,removeValueForKey:()=>true}},{timeout:2000});return result?.body??res;}
const API='https://api.hellobike.com/api';
const cases=[
 [{action:'adx.ssp.show'},{code:0,data:{adm:[{impid:'a',creative:[1],backupCreative:[2],adAllianceMappings:{a:1}}]}},x=>assert.deepEqual(x.data.adm[0],{impid:'a',creative:[],backupCreative:[],adAllianceMappings:{}})],
 [{action:'homepage.startup.popupWindow'},{code:0,data:[{popupWindowType:'marketAd',popupWindowData:{}},{popupWindowType:'serviceNotice',popupWindowData:{keep:1}}]},x=>assert.equal(x.data.length,1)],
 [{action:'homepage.feeds.data',pageId:'platform_home'},{code:0,data:{hasMore:true,list:[{cardId:"a",cardType:"ad",cardInfo:{}}]}},x=>{assert.deepEqual(x.data.list,[]);assert.equal(x.data.hasMore,false)}],
 [{action:'homepage.feeds.second.data',pageId:'platform_me'},{code:200,data:[{cardId:"a",cardType:"ad",cardInfo:{}}]},x=>assert.deepEqual(x.data,[])],
 [{action:'homepage.waterfall.module.data'},{code:0,data:{materialList:[1],needRequest:true,pageIndex:1}},x=>assert.deepEqual(x.data.materialList,[])],
 [{action:'homepage.module.newdata'},{code:0,data:{moduleList:[{moduleKey:'homepage_feeds_module'},{moduleKey:'homepage_waterfall_module'},{moduleKey:'homepage_keyposition',moduleData:{gridList:[{gridName:'借钱'},{gridName:'骑行'}]}}]}},x=>{assert.equal(x.data.moduleList.length,1);assert.deepEqual(x.data.moduleList[0].moduleData.gridList,[{gridName:'骑行'}])}],
 [{action:'lego.bff.data',pageCode:'LEGO_MY_PAGE'},{code:0,data:[{moduleKey:'LEGO_MY_PAGE_FEEDS',moduleData:{}},{moduleKey:'orders',moduleData:{keep:1}}]},x=>assert.equal(x.data.length,1)],
 [{action:'homepage.shortcut.scene.perception'},{code:0,data:{hitchBannerConfig:{bannerCouponInfoNew:{styleUrl:'https://resource.51downapp.cn/c4c107668f5005ecd51924636eca3213.json?md5=c4c107668f5005ecd51924636eca3213',backgroundImage:'https://assets.51downapp.cn/platform/7b09ca8186d2480f9493158b14b80197'},title:'ad'}}},x=>assert.equal(x.data.hitchBannerConfig.bannerCouponInfoNew,null)]
];
cases.push(
 [{action:'lego.bff.data',pageCode:'LEGO_MY_PAGE'},{code:0,data:[{moduleKey:'LEGO_MY_PAGE_MY_CAPITAL_NEW',moduleType:2,moduleData:{dslUrl:'https://resource.51downapp.cn/f414fbc17c411b4e986ba8891c738a49.json?md5=f414fbc17c411b4e986ba8891c738a49',recommendedSlot:{ad:1}}}]},x=>{assert.equal(x.data[0].moduleData.recommendedSlot,null);assert.ok(x.data[0].moduleData.dslUrl.endsWith('hbe_qx_ui=1.3'))}],
 [{action:'lego.bff.data',pageCode:'LEGO_MY_PAGE'},{code:0,data:[{moduleKey:'LEGO_MY_PAGE_MY_WALLET',moduleType:2,moduleData:{dslUrl:'https://resource.51downapp.cn/2c616bdaab8255dec1c8428d5b9c18b4.json?md5=2c616bdaab8255dec1c8428d5b9c18b4',walletUrl:'wallet',financeEntries:[{type:'lending'}]}},{moduleKey:'orders',moduleData:{}}]},x=>assert.deepEqual(x.data,[{moduleKey:'orders',moduleData:{}}])]
);
for(const [req,obj,check] of cases){
 for(const mode of ['plain','aes','quoted']){
  let request=JSON.stringify(req);let body=JSON.stringify(obj);
  if(mode!=='plain'){request=cipher(request);body=cipher(body);}
  if(mode==='quoted'){request=JSON.stringify(request);body=JSON.stringify(body);}
  const ctx=context(API,request,body);const out=await run(ctx);
  assert.equal(out.body,original(API,request,body));
  let decoded=out.body;if(mode==='quoted')decoded=JSON.parse(decoded);if(mode!=='plain')decoded=cipher(decoded,STATIC,true);
  check(JSON.parse(decoded));
 }
}
// Local key capture and subsequent dynamic-key encrypted response.
const keyBody=cipher(JSON.stringify({code:0,data:{key:DYNAMIC,'key-version':'v1','fingerprint-hash':'test-fingerprint',expired:Math.floor(Date.now()/1000)+3600}}));
assert.equal((await run(context('https://api.hellobike.com/secretkey','{}',keyBody))).body,keyBody);
assert.ok(saved.has('HelloBike.Egern.HelloBikeQXKeyCacheV1'));assert.equal(notifications.length,1);assert.ok(notifications[0].body.includes('Egern 本机'));
const req=cipher(JSON.stringify(cases[0][0]),DYNAMIC),res=cipher(JSON.stringify(cases[0][1]),DYNAMIC);
const out=await run(context(API,req,res,'response',{'key-version':'v1','fingerprint-hash':'test-fingerprint'}));
cases[0][2](JSON.parse(cipher(out.body,DYNAMIC,true)));
assert.equal((await run(context(API,req,res,'response',{'key-version':'wrong','fingerprint-hash':'test-fingerprint'}))).body,res);
// Template synthetic response with independently verified hash.
const url='https://resource.51downapp.cn/f414fbc17c411b4e986ba8891c738a49.json?md5=e5230c919f7e3f3af3256161fbfaa0e2&hbe_qx_ui=1.3';
const echo=(await run(context(url,'','','echo'))).synthetic;
assert.equal(echo.status,200);assert.equal(createHash('sha256').update(echo.body).digest('hex'),'250a8f7cbd00aee3ad6ad986ffe72170518d6b4666804827c458964dae576a58');
assert.equal((await run(context(url.replace('hbe_qx_ui=1.3','hbe_qx_ui=invalid'),'','','echo'))).synthetic.status,503);
// Driver member promotion and large number preservation.
const taxi='https://taxiapi.hellobike.com/api';
const taxiBody='{"code":0,"data":{"id":9223372036854775807,"payProductBanner":{"url":"https://example.com/ph-driver-member"}}}';
const taxiOut=await run(context(taxi,'{}',taxiBody,'response',{action:'hitch.driver.journeyList'}));
assert.equal(taxiOut.body,'{"code":0,"data":{"id":9223372036854775807}}');
assert.equal((await run(context(API,'{"action":"unknown"}',taxiBody))).body,taxiBody);
for(const bad of ['', '{}','null','invalid','"broken"'])assert.equal((await run(context(API,JSON.stringify(cases[0][0]),bad))).body,bad);
assert.equal((await run(context(API,JSON.stringify(cases[0][0]),taxiBody,'response',{},503))).body,taxiBody);
const requestOut=await run(context(API,req,'','request'));assert.equal(requestOut.body,req);
console.log('Passed: 10 fixtures × plain/AES/quoted formats with upstream parity; dynamic-key capture/use/mismatch; local template hash/503; driver promotion and 64-bit ID; malformed/unknown/non-200 passthrough; request body preservation.');
