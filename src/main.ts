import { loadManifest } from '@angular-architects/module-federation';
import { environment } from './environments/environment';

const manifestPath = environment.production
  ? 'assets/mf.manifest.prod.json'
  : 'assets/mf.manifest.local.json';

console.log('Production?', environment.production);
console.log('Loading manifest from:', manifestPath);

loadManifest(manifestPath)
  .catch(err => console.error('Error loading remote entries from manifest:', err))
  .then(() => import('./bootstrap'))
  .catch(err => console.error('Error bootstrapping app:', err));
