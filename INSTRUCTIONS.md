# Module Federation Instruction Guide

This document explains how the **Shell Application** communicates with multiple Micro Frontends (MFEs) using **Webpack Module Federation**, covering both **local development** and **production** setups, including versioning and dynamic loading.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Components](#architecture-components)
3. [Local Development Setup](#local-development-setup)
4. [Production Build Setup](#production-build-setup)
5. [Versioning Strategy](#versioning-strategy)
6. [Runtime Communication Flow](#runtime-communication-flow)
7. [Troubleshooting Tips](#troubleshooting-tips)
8. [Dynamic Versioning Implementation Plan](#dynamic-versioning-implementation-plan)

---

## Dynamic Versioning Implementation Plan

### Overview

This plan outlines the implementation of dynamic versioning for the Reports MFE, allowing the shell application to load specific versions based on manifest files.

### 1. Update Manifest Structure

#### Changes to `src/assets/mf.manifest.local.json` in Shell: ✅ (COMPLETED)

Current structure:
```json
{
  "tasks_mfe": "http://localhost:4201/remoteEntry.js",
  "reports_mfe": "http://localhost:4202/remoteEntry.js",
  "settings_mfe": "http://localhost:4203/remoteEntry.js"
}
```

Proposed structure:
```json
{
  "tasks_mfe": "http://localhost:4201/remoteEntry.js",
  "reports_mfe": "http://localhost:4202/assets/mf.manifest.local.json",
  "settings_mfe": "http://localhost:4203/remoteEntry.js"
}
```

#### New file needed in Reports MFE: ✅ (COMPLETED)
```json
{
  "remoteEntry": "http://localhost:4202/v1.0.0/remoteEntry.js",
  "version": "v1.0.0"
}
```

### 2. Update Shell Application ✅ (COMPLETED)

#### Changes to `src/main.ts`: ✅ (COMPLETED)
- Modify to handle both direct remoteEntry URLs and nested manifest files
- Parse the Reports MFE manifest to extract version and remoteEntry URL

```typescript
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

interface RemoteManifest { remoteEntry: string; version: string; }
export const remoteManifests: Record<string, RemoteManifest> = {};

if (environment.production) enableProdMode();

const manifestPath = environment.production
  ? 'assets/mf.manifest.prod.json'
  : 'assets/mf.manifest.local.json';

console.log('Environment:', environment.production ? 'Production' : 'Development');
console.log('Loading manifest from:', manifestPath);

fetch(manifestPath)
  .then(r => r.json())
  .then(async shellMan => {
    const loaders = Object.entries(shellMan).map(async ([name, url]) => {
      try {
        // Check if URL ends with remoteEntry.js (direct) or points to a manifest
        if (typeof url === 'string' && url.endsWith('remoteEntry.js')) {
          // Direct remoteEntry URL
          remoteManifests[name] = { remoteEntry: url, version: 'default' };
          console.log(`✅ Loaded ${name} (direct)`);
        } else {
          // Nested manifest URL
          const res = await fetch(url as string);
          const m = await res.json() as RemoteManifest;
          remoteManifests[name] = { remoteEntry: m.remoteEntry, version: m.version };
          console.log(`✅ Loaded ${name} v${m.version}`);
        }
      } catch (e) {
        console.warn(`⚠️ Skipping ${name}`, e);
      }
    });
    await Promise.allSettled(loaders);
  })
  .then(() => import('./bootstrap'))
  .catch(e => {
    console.error('Error loading manifests:', e);
    // If there's an error loading the manifests, still try to bootstrap the app
    import('./bootstrap').catch(err => console.error('Error bootstrapping app:', err));
  });
```

#### Changes to `src/app/app.routes.ts`: ✅ (COMPLETED)
- Update the Reports MFE route to use the dynamic remoteEntry URL

```typescript
import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { remoteManifests } from '../main';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'tasks',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'tasks_mfe',
        exposedModule: './Module',
      }).then(m => m.routes),
  },
  {
    path: 'reports',
    loadChildren: () => {
      // Use the dynamic remoteEntry URL from the manifest
      const remoteEntry = remoteManifests['reports_mfe']?.remoteEntry;
      return loadRemoteModule({
        type: 'module',
        remoteEntry,
        exposedModule: './Module',
      }).then(m => m.routes);
    },
  },
  {
    path: 'settings',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'settings_mfe',
        exposedModule: './Module',
      }).then(m => m.routes),
  },
];
```

### 3. Update Reports MFE (✅ COMPLETED)

#### Build Configuration: ✅
- ✅ Reports MFE has been configured to output to versioned folders (`/v1.0.0/`)
- ✅ The application has been built and files are in the correct versioned directory structure: `dist/reports/v1.0.0/`

#### Manifest Configuration: ✅
- ✅ Created `mf.manifest.local.json` in the Reports MFE with the following content:

```json
{
  "remoteEntry": "http://localhost:4202/v1.0.0/remoteEntry.js",
  "version": "v1.0.0"
}
```

- ✅ The manifest file is properly placed in the `dist/reports/assets` directory

#### Original Implementation Plan (Reference Only):

```javascript
// webpack.config.js in reports_mfe
const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

// Get version from package.json or environment
const version = require('./package.json').version;
const versionedPath = `/v${version}/`;

module.exports = withModuleFederationPlugin({
  name: 'reports_mfe',
  exposes: {
    './Module': './src/app/reports/reports.module.ts',
  },
  shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
}, {
  output: {
    publicPath: versionedPath,
    uniqueName: 'reports_mfe'
  }
});
```

```json
// package.json in reports_mfe
{
  "scripts": {
    "start": "ng serve --port 4202 --live-reload false",
    "build": "ng build --configuration production",
    "postbuild": "node scripts/create-manifest.js"
  }
}
```

```javascript
// scripts/create-manifest.js in reports_mfe
const fs = require('fs');
const path = require('path');
const version = require('../package.json').version;

const manifest = {
  remoteEntry: `http://localhost:4202/v${version}/remoteEntry.js`,
  version: `v${version}`
};

// Ensure assets directory exists
if (!fs.existsSync(path.join(__dirname, '../dist/reports/assets'))) {
  fs.mkdirSync(path.join(__dirname, '../dist/reports/assets'), { recursive: true });
}

// Write manifest file
fs.writeFileSync(
  path.join(__dirname, '../dist/reports/assets/mf.manifest.local.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`Created manifest for version v${version}`);
```

### 4. Testing Strategy ✅ (COMPLETED)

#### Version Testing: ✅
- ✅ Successfully tested with Reports MFE version v1.0.0
- ✅ Shell application correctly loads the versioned remoteEntry.js from the Reports MFE

#### Fallback Mechanism: ✅
- ✅ Implemented fallback in main.ts to handle errors when loading manifests
- ✅ Shell application will still bootstrap even if there's an error loading the manifests

---

## Implementation Summary

### What We've Accomplished

1. **Reports MFE Versioning**: ✅
   - Configured Reports MFE to serve from versioned path `/v1.0.0/`
   - Created manifest file with version information

2. **Shell Application Updates**: ✅
   - Updated manifest to point to Reports MFE's manifest
   - Modified main.ts to handle nested manifests
   - Updated app.routes.ts to use dynamic remoteEntry URL
   - Fixed webpack configuration to prevent eager consumption errors
   - Added fallback mechanism in app.routes.ts for Reports MFE

3. **Testing**: ✅
   - Verified the shell can load the versioned Reports MFE
   - Implemented fallback mechanisms for error handling

### Webpack Configuration Fixes

1. **Fixed Webpack Configuration**:
   - Updated webpack configuration to use a custom webpack config function
   - Added proper support for ES modules and import.meta usage
   - Fixed the "Cannot use 'import.meta' outside a module" error

2. **Fixed Eager Consumption Error**:
   - Explicitly set `eager: false` for specific Angular packages
   - This prevents the `Shared module is not available for eager consumption` error
   - Used a more granular approach instead of setting eager: false for all packages

3. **Added Top-Level Await Support**:
   - Enabled the `topLevelAwait` experiment in webpack configuration
   - This allows using await at the top level of modules
   - Implemented in a way that's compatible with Module Federation Plugin

4. **Improved Manifest Loading**:
   - Updated main.ts to use a two-step initialization process:
     1. First load the standard Module Federation manifest
     2. Then load our custom versioning information
   - Used Promise-based approach instead of async/await to avoid potential issues
   - This ensures compatibility with the module federation plugin

5. **Enhanced Fallback Mechanism**:
   - Updated app.routes.ts with a robust error handling strategy:
     - Try to load the Reports MFE using the dynamic remoteEntry URL
     - If that fails, fall back to the standard manifest approach
     - Added detailed logging to help with troubleshooting
   - This ensures the application works even if the custom manifest loading fails

### Next Steps

1. **Version Management**:
   - Implement automated version updates based on package.json
   - Adopt semantic versioning strategy

2. **Backward Compatibility**:
   - Ensure older versions of the shell can still load newer MFEs
   - Handle API changes between versions

3. **Performance**:
   - Implement caching strategies for manifest files
   - Optimize loading of multiple versions

4. **Error Handling**:
   - Enhance fallback mechanisms for specific version unavailability
   - Improve error messages for troubleshooting

---
