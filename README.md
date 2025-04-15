# Angular Module Federation Project

[![Angular](https://img.shields.io/badge/Angular-14.0.0-red)](https://angular.io/)
[![Webpack](https://img.shields.io/badge/Webpack-5.0.0-blue)](https://webpack.js.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A modern micro frontend architecture using Angular and Webpack 5 Module Federation to build scalable, independently deployable frontend applications.

## Overview

This project demonstrates a modular approach to frontend development with a shell application that dynamically loads feature micro frontends at runtime. Each micro frontend can be developed, tested, and deployed independently.

## Architecture

![Angular MFE Architecture](https://via.placeholder.com/800x400?text=Angular+MFE+Architecture)

### Components

| Application | Description | Port | Repository |
|-------------|-------------|------|------------|
| Shell | Host application with navigation, routing and layout | 4200 | [Shell Repository](./shell) |
| Tasks | Task management micro frontend | 4201 | [Tasks Repository](./tasks) |
| Reports | Analytics and reporting dashboard | 4202 | [Reports Repository](./reports) |
| Settings | User and application configuration | 4203 | [Settings Repository](./settings) |

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)

### Development Setup

1. Clone all repositories:

```bash
git clone <repository-url>
```

2. Install dependencies for each application:

```bash
# In each application directory (shell, tasks, reports, settings)
npm install
```

3. Start all applications:

```bash
# Start Shell
cd shell
npm start

# Start Tasks MFE
cd tasks
npm start

# Start Reports MFE
cd reports
npm start

# Start Settings MFE
cd settings
npm start
```

4. Access the application at http://localhost:4200

## Building for Production

Each application can be built separately:

```bash
# In each application directory
npm run build
```

## Deployment

Deployment workflows are configured to build and deploy each application independently:

1. Build the application
2. Deploy the contents of the `dist/` folder to a static hosting service
3. Update the Shell application's remote entry URLs if necessary

## Technical Details

### Module Federation Configuration

Each micro frontend exposes its routing module to the Shell application:

```javascript
// webpack.config.js excerpt
module.exports = {
  // ...
  plugins: [
    new ModuleFederationPlugin({
      name: 'microFrontendName',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/app/feature/feature.routes.ts'
      },
      shared: share({
        "@angular/core": { singleton: true },
        "@angular/common": { singleton: true },
        "@angular/router": { singleton: true }
        // Additional shared dependencies
      })
    })
  ]
}
```

## Project Structure

Each micro frontend follows a similar structure:

```
project-root/
├── src/
│   ├── app/
│   │   ├── feature/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── feature.module.ts
│   │   │   └── feature.routes.ts
│   │   ├── app.module.ts
│   │   └── app.component.ts
│   ├── assets/
│   ├── environments/
│   ├── index.html
│   └── main.ts
├── webpack.config.js
├── package.json
└── README.md
```


## Acknowledgments

* Angular Team for their excellent framework
* Webpack Team for Module Federation
* All contributors to this project


