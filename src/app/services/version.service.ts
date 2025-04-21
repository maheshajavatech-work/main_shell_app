import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })


export class VersionService {
  private static desired: Record<string,string> = {
    tasks_mfe:   '1.0.0',
    reports_mfe: '1.0.0',
    settings_mfe:'1.0.0'
  };

  // read query param at import time
  static init() {
    const p = new URLSearchParams(window.location.search);
    const t = p.get('tasksVersion');
    if (t) this.desired['tasks_mfe'] = t;
  }

  static getRemoteKey(base: string): string {
    const v = this.desired[base] || '1.0.0';
    return `${base}_v${v}`;
  }
}

VersionService.init();
