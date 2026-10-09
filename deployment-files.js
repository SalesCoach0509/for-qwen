import fs from 'node:fs';
import path from 'node:path';

export function verifyProductionFiles(root) {
  const required = ['dist/index.html', 'dist/release.json', 'backend/contracts/operation-contracts.json', 'backend/contracts/product-spec.json'];
  for (const file of required) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Deployment incomplete: missing ${file}. Run npm run build:render from the project root.`);
  }
  const release = JSON.parse(fs.readFileSync(path.join(root, 'dist/release.json'), 'utf8'));
  if (typeof release.release !== 'string' || !release.release) throw new Error('Deployment release marker is invalid');
  for (const file of required.filter(f => f.endsWith('.json'))) JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  const html = fs.readFileSync(path.join(root, 'dist/index.html'), 'utf8');
  const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(url => url.startsWith('/assets/'));
  if (!assets.some(asset => asset.endsWith('.js'))) throw new Error('Deployment incomplete: index.html has no compiled JavaScript entry');
  for (const asset of assets) {
    const file = path.resolve(root, 'dist', '.' + asset);
    if (!file.startsWith(path.resolve(root,'dist') + path.sep) || !fs.existsSync(file)) throw new Error(`Deployment incomplete: missing built asset ${asset}`);
  }
  return release;
}
