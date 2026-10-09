import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyProductionFiles } from '../backend/deployment-files.js';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function verifySource(root) {
  for (const name of ['package.json','backend/package.json','backend/server.js','backend/contracts/operation-contracts.json','backend/contracts/product-spec.json','index.html','src/main.tsx','vite.config.js','tsconfig.json','public/release.json']) {
    if (!fs.existsSync(path.join(root,name))) throw new Error(`Build source incomplete: missing ${name}. Upload the complete project and use its root as the build context.`);
  }
  for (const folder of ['', 'backend']) {
    const manifest = JSON.parse(fs.readFileSync(path.join(root,folder,'package.json'),'utf8'));
    const lock = path.join(root,folder,'package-lock.json');
    if (!fs.existsSync(lock)) { console.warn(`LOCKFILE_MISSING: ${folder || 'frontend'} dependencies will be resolved using npm install.`); continue; }
    const data = JSON.parse(fs.readFileSync(lock,'utf8'));
    if (!data.lockfileVersion || !data.packages?.['']) throw new Error(`Invalid lockfile: ${folder}/package-lock.json`);
    for (const section of ['dependencies','devDependencies']) {
      if (JSON.stringify(Object.entries(manifest[section] || {}).sort()) !== JSON.stringify(Object.entries(data.packages[''][section] || {}).sort())) throw new Error(`Lockfile does not match ${folder || 'frontend'} package.json; regenerate and commit it.`);
    }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === 'runtime') verifyProductionFiles(projectRoot);
  else verifySource(projectRoot);
  console.log('DEPLOYMENT_CHECK_PASSED: ' + (process.argv[2] || 'source'));
}
