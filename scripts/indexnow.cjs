'use strict';
// IndexNow ownership proof is a public text file, not a private account/API credential.
// No Google/Bing account login, cookies or stored credentials are used.
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
function plan({root=ROOT,all=false,files}={}) {
  const config=JSON.parse(fs.readFileSync(path.join(root,'indexnow.json'),'utf8'));
  assert.equal(config.host,'obeloworks.com');
  assert.match(config.keyFile,/^[a-f0-9]{32}\.txt$/);
  const key=fs.readFileSync(path.join(root,config.keyFile),'utf8').trim();
  assert.equal(key,config.keyFile.slice(0,-4));
  const listed=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
  if(!all&&!files) files=execFileSync('git',['diff','--name-only','HEAD^','HEAD'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/);
  const first=files?.includes(config.keyFile);
  const urls=all||first?listed:(files||[]).filter(f=>f.endsWith('.html')&&!/^(ad\/|ad-js\/|lookout\/)/.test(f)&&!f.endsWith('/builds.html')).map(f=>'https://'+config.host+'/'+f.replace(/index\.html$/,''));
  for(const value of urls) {
    const url=new URL(value);
    assert.equal(url.origin,'https://'+config.host);
    assert.equal(url.search,'');assert.equal(url.hash,'');
  }
  return {host:config.host,key,keyLocation:'https://'+config.host+'/'+config.keyFile,urlList:[...new Set(urls)]};
}
async function submit(payload,request=fetch) {
  if(!payload.urlList.length)return {status:'skipped',submitted:0,reason:'No public HTML content changed'};
  const proof=await request(payload.keyLocation,{signal:AbortSignal.timeout(20000),redirect:'error'});
  assert.ok(proof.ok,'Published ownership proof is not available');
  assert.equal((await proof.text()).trim(),payload.key,'Published ownership proof differs');
  const response=await request('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000),redirect:'error'});
  if(![200,202].includes(response.status))throw Error('IndexNow submission failed with HTTP '+response.status);
  return {status:'accepted',httpStatus:response.status,submitted:payload.urlList.length,indexingGuaranteed:false};
}
if(require.main===module) {
  (async()=>{
    const payload=plan({all:process.argv.includes('--all')});
    const result=process.argv.includes('--dry-run')?{status:'dry-run',submitted:payload.urlList.length,urls:payload.urlList}:await submit(payload);
    console.log(JSON.stringify(result,null,2));
  })().catch(error=>{console.error(error.message);process.exitCode=1});
}
module.exports={plan,submit};
