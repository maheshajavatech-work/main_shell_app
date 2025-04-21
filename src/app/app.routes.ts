import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes }             from '@angular/router';
import { HomeComponent }      from './home/home.component';
import { VersionService }     from './services/version.service';

function extractRoutes(m: any): Routes {
  // prefer the function if it exists
  if (typeof m.getRoutes === 'function') {
    return m.getRoutes();
  }
  // fallback to the array export
  if (Array.isArray(m.routes)) {
    return m.routes;
  }
  throw new Error('Remote module has no routes or getRoutes()!');
}

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent },
  {
    path: 'tasks',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: VersionService.getRemoteKey('tasks_mfe'),
        exposedModule: './Module',
      })
      .then(extractRoutes)
  },
  

  {
    path: 'reports',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'reports_mfe',
        exposedModule: './Module'
      }).then(m => m.routes)
  },
  {
    path: 'settings',
    loadChildren: () =>
      loadRemoteModule({
        type: 'manifest',
        remoteName: 'settings_mfe',
        exposedModule: './Module'
      }).then(m => m.routes)
  }
];
