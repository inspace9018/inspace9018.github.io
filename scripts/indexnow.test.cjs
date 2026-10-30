'use strict';
const assert=require('node:assert/strict');
const {plan,submit}=require('./indexnow.cjs');
async function run() {
  const full=plan({all:true});
  assert.equal(full.urlList.length,225);
  assert.equal(new Set(full.urlList).size,225);
  assert.equal(plan({files:['ads.txt','.github/workflows/sync-ads-txt.yml']}).urlList.length,0);
  assert.deepEqual(plan({files:['guide/heroes/haze/index.html','en/help/performance/index.html','gone.html','ad/index.html','lookout/bridge/index.html','guide/builds.html']}).urlList,[
    'https://obeloworks.com/guide/heroes/haze/','https://obeloworks.com/en/help/performance/','https://obeloworks.com/gone.html'
  ]);
  assert.equal(plan({files:[full.key+'.txt']}).urlList.length,225);
  let calls=[];
  const request=async (url,options) => {
    calls.push({url,options});
    if(options.method==='POST')return {status:202};
    return {ok:true,text:async()=>full.key};
  };
  assert.deepEqual(await submit(full,request),{status:'accepted',httpStatus:202,submitted:225,indexingGuaranteed:false});
  assert.equal(calls[0].url,full.keyLocation);
  assert.equal(calls[1].url,'https://api.indexnow.org/indexnow');
  assert.equal(JSON.parse(calls[1].options.body).urlList.length,225);
  calls=[];
  await assert.rejects(submit(full,async(url,options)=>{calls.push(url);return {ok:true,text:async()=>'different-proof'};}),/differs/);
  assert.equal(calls.length,1,'Wrong public ownership proof must prevent submission');
  assert.equal((await submit(plan({files:['ads.txt']}),async()=>{throw Error('No request expected')})).status,'skipped');
  await assert.rejects(submit(full,async(url,options)=>options.method==='POST'?{status:429}:{ok:true,text:async()=>full.key}),/429/);
  assert.equal((await submit(full,async(url,options)=>options.method==='POST'?{status:200}:{ok:true,text:async()=>full.key})).httpStatus,200);
  console.log('IndexNow: 225 canonical URLs, changes/deletions, ads-only skip, public proof and HTTP handling passed. No network requests.');
}
run().catch(e=>{console.error(e);process.exitCode=1});
