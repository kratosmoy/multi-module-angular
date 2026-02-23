import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ExternalAppConfig {
    id: string;
    name: string;
    description: string;
    url: string;
    bgStyle: string;
    logo: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private externalApps: ExternalAppConfig[] = [];

    constructor(private http: HttpClient) { }

    loadExternalApps(): Observable<ExternalAppConfig[]> {
        return this.http.get<ExternalAppConfig[]>('/assets/external-apps.json').pipe(
            tap(apps => this.externalApps = apps)
        );
    }

    getExternalApps(): ExternalAppConfig[] {
        return this.externalApps;
    }

    getExternalAppById(id: string): ExternalAppConfig | undefined {
        return this.externalApps.find(app => id.startsWith('ext-') && app.id === id.substring(4)) || this.externalApps.find(app => app.id === id);
    }
}
