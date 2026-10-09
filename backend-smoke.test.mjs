import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('production server serves the merged release and preserves roleplay context across the provider boundary', async () => {
  let captured;
  let providerReply = JSON.stringify({stakeholderResponse:'Which outcome matters most to you?',interactionState:'CURIOUS',objectionStatus:'OPEN',difficulty:'medium',capabilityBeingTested:'Discovery'});
  let providerStatus = 200;
  const upstream = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    captured = JSON.parse(body);
    res.writeHead(providerStatus, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(providerStatus === 200 ? { choices: [{ message: { content: providerReply } }] } : { error: 'Provider unavailable 503 test-only-secret' }));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const portProbe = createServer();
  portProbe.listen(0, '127.0.0.1');
  await once(portProbe, 'listening');
  const port = portProbe.address().port;
  await new Promise(resolve => portProbe.close(resolve));
  const backend = spawn(process.execPath, ['backend/server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), LLM_PROVIDER: 'openai-compatible', LLM_MODEL: 'local-test', LLM_API_KEY: 'test-only-secret', LLM_BASE_URL: `http://127.0.0.1:${upstream.address().port}/v1`, LLM_FALLBACK_PROVIDER: '', LLM_FALLBACK_MODEL: '', LLM_MAX_ATTEMPTS: '1' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let logs = '';
  backend.stdout.on('data', c => { logs += c; });
  backend.stderr.on('data', c => { logs += c; });
  const origin = `http://127.0.0.1:${port}`;
  try {
    let health;
    for (let i = 0; i < 100; i++) {
      try { health = await (await fetch(`${origin}/api/health`)).json(); break; } catch { await new Promise(r => setTimeout(r, 100)); }
    }
    assert.equal(health?.release, 'performance-v1-consolidated-20261007', logs);
    assert.equal(health.status, 'ok', logs);
    assert.equal((await (await fetch(`${origin}/release.json`)).json()).release,health.release);
    assert.match(await (await fetch(origin)).text(), /\/assets\/index-/);
    const payload = { userMessage: 'What concerns you?', sessionId: 's1', conversationHistory: [{ role: 'ai', content: 'I need clarity.' }, { role: 'user', content: 'What concerns you?' }], config: { interactionId:'moment-1', stakeholderRole: 'CFO', pressureLevel: 'high', personality: 'Skeptical', objectives: ['Understand value'], likelyObjections: ['Risk'], interactionContext: 'Renewal meeting', targetBehavior: 'Clarify first', dealIntelligence: { solution: 'Actual product' }, requiredBehaviors: ['Ask a question'] } };
    const post = () => fetch(`${origin}/api/ai/roleplay/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const response = await post();
    assert.equal(response.status, 200, logs);
    assert.equal((await response.json()).sessionId, 's1');
    assert.equal(captured.messages.filter(m => m.content === 'What concerns you?').length, 1);
    assert.equal(captured.messages[1].role, 'assistant');
    assert.match(captured.messages[0].content, /Actual product/);
    assert.match(captured.messages[0].content, /Clarify first/);
    const html=await (await fetch(origin)).text();
    for(const [,asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
      const response=await fetch(origin+asset);assert.equal(response.status,200,asset);
      if(asset.endsWith('.js'))assert.match(response.headers.get('content-type'),/javascript/);
      if(asset.endsWith('.css'))assert.match(response.headers.get('content-type'),/css/);
    }
    const svg=await fetch(origin+'/vite.svg');assert.equal(svg.status,200);assert.match(svg.headers.get('content-type'),/image\/svg/);assert.doesNotMatch(await svg.text(),/<html/i);
    for(const asset of ['/missing.js','/missing.css','/missing.woff2','/assets/missing.svg'])assert.equal((await fetch(origin+asset)).status,404,asset);
    assert.equal((await fetch(origin+'/api/unknown')).status,404);
    assert.match((await fetch(origin+'/performance/moment',{headers:{Accept:'text/html'}})).headers.get('content-type'),/html/);
    const invalid=await fetch(origin+'/api/ai/roleplay/respond',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,sessionId:''})});assert.equal(invalid.status,400);
    const brokenJson=await fetch(origin+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(brokenJson.status,400);assert.match(brokenJson.headers.get('content-type'),/json/);
    const chat=body=>fetch(origin+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await chat({messages:[{role:'user',content:'test'}],options:{operation:'UNRECOGNISED',jsonMode:true}})).status,400);
    const validChat={messages:[{role:'user',content:JSON.stringify({score:{},config:{scenarioTitle:'Context must not select the output schema',objectionLadder:[],commercialGuidance:{},stakeholderPriorities:[]}})}],options:{operation:'PRACTICE_INTERVENTION_GENERATION',jsonMode:true}};
    providerReply=JSON.stringify({recommendation:'Clarify first',successCriterion:'Ask a diagnostic question'});
    assert.equal((await chat(validChat)).status,200);
    providerReply='{}';assert.equal((await chat(validChat)).status,502);
    providerReply = '';
    assert.equal((await post()).status, 503);
    providerStatus = 503;
    const failed=await post();assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/test-only-secret/);assert.doesNotMatch(logs,/test-only-secret/);
  } finally {
    const stopped = once(backend, 'exit');
    backend.kill();
    await stopped;
    upstream.closeAllConnections();
    await new Promise(resolve => upstream.close(resolve));
  }
});
