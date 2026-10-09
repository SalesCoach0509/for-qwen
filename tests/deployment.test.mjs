import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {verifySource,projectRoot} from '../scripts/check-deployment.mjs';
import {verifyProductionFiles} from '../backend/deployment-files.js';

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'coach-deployment-'));
  t.after(()=>{const resolved=fs.realpathSync(root);assert.ok(resolved.startsWith(fs.realpathSync(os.tmpdir())+path.sep));assert.ok(path.basename(resolved).startsWith('coach-deployment-'));fs.rmSync(resolved,{recursive:true,force:true});});
  for(const name of ['backend/contracts/operation-contracts.json','backend/contracts/product-spec.json','dist/release.json','package.json','backend/package.json','public/release.json']){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),JSON.stringify({release:'fixture',dependencies:{}}));}
  for(const name of ['backend/server.js','src/main.tsx','vite.config.js','tsconfig.json','index.html','dist/assets/app.js','dist/assets/app.css']){fs.mkdirSync(path.dirname(path.join(root,name)),{recursive:true});fs.writeFileSync(path.join(root,name),'');}
  fs.writeFileSync(path.join(root,'dist/index.html'),'<script src="/assets/app.js"></script><link href="/assets/app.css">');
  return root;
}
test('source preflight allows absent lockfiles but rejects incomplete uploads',t=>{
  const root=fixture(t);assert.doesNotThrow(()=>verifySource(root));
  fs.unlinkSync(path.join(root,'backend/contracts/product-spec.json'));
  assert.throws(()=>verifySource(root),/missing backend\/contracts\/product-spec.json/);
});
test('stale or malformed lockfiles fail instead of silently resolving different dependencies',t=>{
  const root=fixture(t);
  fs.writeFileSync(path.join(root,'package-lock.json'),JSON.stringify({lockfileVersion:3,packages:{'':{dependencies:{wrong:'1.0.0'}}}}));
  assert.throws(()=>verifySource(root),/does not match/);
});
for(const name of ['dist/index.html','dist/release.json','dist/assets/app.js','dist/assets/app.css','backend/contracts/operation-contracts.json']){
  test('production rejects missing '+name,t=>{const root=fixture(t);assert.equal(verifyProductionFiles(root).release,'fixture');fs.unlinkSync(path.join(root,name));assert.throws(()=>verifyProductionFiles(root),/Deployment incomplete/);});
}
test('source HTML cannot masquerade as a completed production build',t=>{const root=fixture(t);fs.writeFileSync(path.join(root,'dist/index.html'),'<script src="/src/main.tsx"></script>');assert.throws(()=>verifyProductionFiles(root),/no compiled JavaScript/);});
test('production starts without provider credentials, honors PORT, and reports its actual build',async()=>{
  const probe=createServer().listen(0,'127.0.0.1');await once(probe,'listening');const port=probe.address().port;await new Promise(r=>probe.close(r));
  const env={...process.env,NODE_ENV:'production',PORT:String(port)};for(const key of Object.keys(env))if(key.startsWith('LLM_')||key.endsWith('_API_KEY'))delete env[key];
  const child=spawn(process.execPath,[path.join(projectRoot,'backend/server.js')],{cwd:os.tmpdir(),env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);
  try{
    let ready;for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error(logs);try{ready=await fetch(`http://127.0.0.1:${port}/api/ready`);break;}catch{await new Promise(r=>setTimeout(r,100));}}
    assert.ok(ready,logs);assert.equal(ready.status,200);
    const identity=await ready.json();const release=await (await fetch(`http://127.0.0.1:${port}/release.json`)).json();assert.equal(identity.release,release.release);
    const health=await(await fetch(`http://127.0.0.1:${port}/api/health`)).json();assert.equal(health.status,'degraded');assert.equal(health.apiKeySet,false);
    assert.equal((await fetch(`http://127.0.0.1:${port}/`)).status,200);
  }finally{if(child.exitCode===null){const stopped=once(child,'exit');child.kill();await stopped;}}
});
test('relative imports match exact case for Linux deployments',()=>{
  function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='node_modules')continue;const file=path.join(dir,e.name);if(e.isDirectory()){walk(file);continue;}if(!/\.(tsx?|m?js)$/.test(e.name))continue;const text=fs.readFileSync(file,'utf8');for(const [,ref] of text.matchAll(/(?:from\s+|import\s*\(\s*)['"](\.[^'"]+)['"]/g)){
    const resolved=path.resolve(path.dirname(file),ref);const candidates=[resolved,...['.ts','.tsx','.js','.json','/index.ts','/index.tsx'].map(s=>resolved+s)];const match=candidates.find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());assert.ok(match,`${file}: ${ref}`);
    let cursor=projectRoot;for(const part of path.relative(projectRoot,match).split(path.sep)){assert.ok(fs.readdirSync(cursor).includes(part),`Linux case mismatch: ${match}`);cursor=path.join(cursor,part);}
  }}}
  walk(path.join(projectRoot,'src'));walk(path.join(projectRoot,'backend'));
});
