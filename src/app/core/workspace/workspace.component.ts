import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TabService } from './tab.service';
import { DataQueryComponent } from '../../features/data-query/data-query.component';
import { ExternalIframeComponent } from '../../features/external-iframe/external-iframe.component';

import { ConfigService } from '../services/config.service';

@Component({
  standalone: false,
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})
export class WorkspaceComponent implements OnInit, OnDestroy {
  private routeSub: Subscription | undefined;

  constructor(
    private route: ActivatedRoute,
    public tabService: TabService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const moduleId = params.get('moduleId');
      if (moduleId) {
        this.openModule(moduleId);
      }
    });
  }

  ngOnDestroy() {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  openModule(moduleId: string) {
    const internalConfig = this.configService.getInternalModuleById(moduleId);
    if (internalConfig) {
      this.tabService.addTab({
        id: moduleId,
        title: internalConfig.name,
        componentType: DataQueryComponent,
        data: { config: internalConfig }
      });
    } else if (moduleId.startsWith('ext-')) {
      const appConfig = this.configService.getExternalAppById(moduleId);
      if (appConfig) {
        this.tabService.addTab({
          id: moduleId,
          title: appConfig.name,
          componentType: ExternalIframeComponent,
          data: { url: appConfig.url }
        });
      } else {
        // If config is not loaded yet, we might need a workaround or reload configs.
        // For simplicity, we can still load the tab with a fallback.
        this.tabService.addTab({
          id: moduleId,
          title: 'External App',
          componentType: ExternalIframeComponent,
          data: { url: '' }
        });
      }
    } else {
      console.warn('Unknown module: ', moduleId);
    }
  }

  closeTab(index: number, event: MouseEvent) {
    event.stopPropagation();
    this.tabService.removeTab(index);
  }

  onTabChange(index: number) {
    this.tabService.setActiveTab(index);
  }
}
