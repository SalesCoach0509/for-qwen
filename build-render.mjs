import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { projectRoot, verifySource } from './check-deployment.mjs';
import { verifyProductionFiles } from '../backend/deployment-files.js';

function run(args, cwd = projectRoot) {
  console.log('BUILD_STEP: ' + args.join(' '));
  const result = spawnSync(process.execPath, args, {cwd, stdio:'inherit', env:process.env, windowsHide:true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Build command failed: ' + args.join(' '));
}
verifySource(projectRoot);
const npm = process.env.npm_execpath;
if (!npm) throw new Error('Run this build using npm run build:render');
for (const folder of ['', 'backend']) {
  const cwd = path.join(projectRoot, folder);
  run([npm, fs.existsSync(path.join(cwd,'package-lock.json')) ? 'ci' : 'install', folder ? '--omit=dev' : '--include=dev', '--no-fund'], cwd);
}
run(['node_modules/typescript/bin/tsc','--noEmit']);
// Pin the output directory independently of Vite configuration defaults.
run(['node_modules/vite/bin/vite.js','build','--outDir','dist','--emptyOutDir']);
const release = verifyProductionFiles(projectRoot);
console.log('RENDER_BUILD_VERIFIED: ' + release.release + ' -> ' + path.join(projectRoot,'dist/index.html'));
