# Step‑by‑Step Guide to Implement Versioned Module Federation

This guide walks you through adding versioning to your **tasks_mfe** and loading specific versions from the **Shell Application** using Webpack Module Federation. We’ll cover both **build** and **runtime** changes, and how to serve multiple versions locally.

---

## Prerequisites

- Angular CLI (v19+) installed
- `@angular-architects/module-federation` plugin added to both shell and MFE projects
- Node.js (>=16) and npm

---

## Part 1: Prepare the Tasks MFE for Versioning

### 1.1. Install `cross-env`

```bash
cd path/to/tasks_mfe
npm install --save-dev cross-env
```

### 1.2. Parameterize `MFE_VERSION` in Webpack Config

Edit **`webpack.config.js`** in `tasks_mfe`: pull in `process.env.MFE_VERSION` and use it for `name`, `publicPath`, and output directory:

```js
const { shareAll, withModuleFederationPlugin } =
  require('@angular-architects/module-federation/webpack');
const webpack = require('webpack');

// 1. Get MFE_VERSION from env (default 1.0.0)
const version = process.env.MFE_VERSION || '1.0.0';
const port    = 4201;
const name    = `tasks_mfe_v${version}`;
const publicPath = `http://localhost:${port}/v${version}/`;

module.exports = withModuleFederationPlugin(
  {
    name,
    filename: 'remoteEntry.js',
    exposes: { './Module': 'src/app/feature/feature.routes.ts' },
    shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
  },
  {
    output: {
      publicPath,
      uniqueName: name,
      chunkLoading: 'jsonp',
      library: { type: 'var', name }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.MFE_APP_VERSION': JSON.stringify(version)
      })
    ]
  }
);
```

### 1.3. Update `package.json` Scripts for Versioned Builds

In `tasks_mfe/package.json`:

```jsonc
"scripts": {
  "build:v1.0.0": "cross-env MFE_VERSION=1.0.0 ng build --configuration production",
  "build:v1.1.0": "cross-env MFE_VERSION=1.1.0 ng build --configuration production",
  "serve:dist": "npm run build:v1.0.0 && npm run build:v1.1.0 && http-server --watch ./dist/tasks_mfe -p 4201"
}
```

Install `http-server` for static serving:

```bash
npm install --save-dev http-server
```

---

## Part 2: Serving Multiple Versions Locally

### 2.1. Build Versioned Outputs

```bash
eval "npm run build:v1.0.0"
eval "npm run build:v1.1.0"
```

This produces:
```
dist/tasks_mfe/v1.0.0/remoteEntry.js
dist/tasks_mfe/v1.1.0/remoteEntry.js
...other chunks under each version folder...
```

### 2.2. Serve via `http-server`

```bash
npm run serve:dist
```

Now:
- `http://localhost:4201/v1.0.0/remoteEntry.js`
- `http://localhost:4201/v1.1.0/remoteEntry.js`

Should both resolve correctly.

---

## Part 3: Update the Shell Application

### 3.1. Shell Manifest with Versioned Entries

Edit **`shell/src/assets/mf.manifest.local.json`**:

```json
{
  "tasks_mfe_v1.0.0": "http://localhost:4201/v1.0.0/assets/mf.manifest.local.json",
  "tasks_mfe_v1.1.0": "http://localhost:4201/v1.1.0/assets/mf.manifest.local.json",
  "reports_mfe":        "http://localhost:4202/assets/mf.manifest.local.json",
  "settings_mfe":       "http://localhost:4203/assets/mf.manifest.local.json"
}
```

Each versioned manifest (e.g. `v1.0.0/assets/mf.manifest.local.json`) should contain:

```json
{ "remoteEntry": "http://localhost:4201/v1.0.0/remoteEntry.js", "version": "1.0.0" }
```

### 3.2. Add a Version Selection Service

Generate a service:
```bash
ng generate service core/config/version
```

Implement **`VersionService`** in `shell/src/app/core/config/version.service.ts`:

```ts
@Injectable({ providedIn: 'root' })
export class VersionService {
  private versions = { tasks_mfe: '1.0.0' };

  get(versionKey: string): string {
    // Optionally override via URL param
    const param = new URLSearchParams(location.search).get('tasksVersion');
    return param || this.versions[versionKey];
  }

  manifestKey(base: string) {
    const v = this.get(base);
    return `${base}_v${v}`;
  }
}
```

### 3.3. Adapt `main.ts` to Use All Manifest Keys

Ensure your loader fetches **every** key in the shell manifest (including `tasks_mfe_v1.0.0`, `tasks_mfe_v1.1.0`). Then `remoteManifests[...]` will hold each version’s entry.

### 3.4. Update Route Loader to Pick a Version

In `shell/src/app/app.routes.ts`:

```ts
import { VersionService } from './core/config/version.service';

const versionService = inject(VersionService);

export function loadVersionedMfe(base: string, modulePath: string) {
  const key = versionService.manifestKey(base);
  const entry = remoteManifests[key]?.remoteEntry;
  if (!entry) {
    throw new Error(`No manifest found for ${key}`);
  }
  return loadRemoteModule({ type: 'module', remoteEntry: entry, exposedModule: modulePath })
    .then(m => m.routes);
}

export const routes: Routes = [
  { path: 'tasks', loadChildren: () => loadVersionedMfe('tasks_mfe', './Module') },
  // … other routes …
];
```

---

## Part 4: Verification & Troubleshooting

1. **Run Shell**: `npm start` → navigate to `/home`, see no errors.  
2. **Navigate to `/tasks`**: verify the chosen version loads (check console log of `process.env.MFE_APP_VERSION`).  
3. **Override Version**: append `?tasksVersion=1.1.0` to URL and refresh—shell should now load v1.1.0.  
4. **Common Issues**:  
   - 404 on `/v1.0.0/remoteEntry.js`: check static server path.  
   - CORS: add `Access-Control-Allow-Origin: *` in MFE dev server.  
   - Runtime errors: ensure `chunkLoading: 'jsonp'` + `library: { type: 'var' }` in your shell webpack.

---

*End of Guide*

