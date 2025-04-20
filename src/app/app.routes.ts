import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes }             from '@angular/router';
import { HomeComponent }      from './home/home.component';
import { VersionService }     from './services/version.service';

export const routes: Routes = [
  { path: '',      pathMatch: 'full', redirectTo: 'home' },
  { path: 'home',  component: HomeComponent },
  {
    path: 'tasks',
    loadChildren: () => {
      const remoteKey = VersionService.getRemoteKey('tasks_mfe');
      return loadRemoteModule({
        type: 'manifest',
        remoteName: remoteKey,
        exposedModule: './Module'
      }).then(m => m.routes);
    }
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
