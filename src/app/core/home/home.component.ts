import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigService, ExternalAppConfig } from '../services/config.service';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  constructor(
    private router: Router,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef
  ) {}

  currentTab: 'all' | 'favorites' = 'all';
  favoriteIds: string[] = [];
  isLoading = true;

  modules: any[] = [];

  ngOnInit() {
    this.modules = [
      {
        id: 'data-query',
        name: 'Data Query Module',
        description: 'Query and view data from backend API.',
        bgStyle: 'linear-gradient(135deg, #1b539c 0%, #089fd1 100%)',
        logo: 'DQ'
      }
    ];

    const cachedApps = this.configService.getExternalApps();
    if (cachedApps && cachedApps.length > 0) {
      this.appendExternalApps(cachedApps);
      this.isLoading = false;
      return;
    }

    this.configService.loadExternalApps().subscribe({
      next: apps => {
        this.appendExternalApps(apps);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('Failed to load external apps config', err);
        this.initializeFavorites();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private appendExternalApps(apps: ExternalAppConfig[]) {
    apps.forEach(app => {
      this.modules.push({
        id: 'ext-' + app.id,
        name: app.name,
        description: app.description,
        bgStyle: app.bgStyle || 'linear-gradient(135deg, #4b1b9c 0%, #ca08d1 100%)',
        logo: app.logo || 'EA'
      });
    });
    this.initializeFavorites();
  }

  initializeFavorites() {
    const saved = localStorage.getItem('favoriteModules');
    if (saved) {
      this.favoriteIds = JSON.parse(saved);
      // Clean up favorites that no longer exist
      this.favoriteIds = this.favoriteIds.filter(fId => this.modules.some(m => m.id === fId));
    } else {
      this.favoriteIds = this.modules.map(m => m.id);
      this.saveFavorites();
    }
  }

  searchTerm: string = '';

  saveFavorites() {
    localStorage.setItem('favoriteModules', JSON.stringify(this.favoriteIds));
  }

  toggleFavorite(moduleId: string, event: Event) {
    event.stopPropagation();
    const index = this.favoriteIds.indexOf(moduleId);
    if (index === -1) {
      this.favoriteIds.push(moduleId);
    } else {
      this.favoriteIds.splice(index, 1);
    }
    this.saveFavorites();
  }

  removeFavorite(moduleId: string, event: Event) {
    event.stopPropagation();
    this.favoriteIds = this.favoriteIds.filter(id => id !== moduleId);
    this.saveFavorites();
  }

  onSearch(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
  }

  get displayedModules() {
    let filtered = this.modules;

    if (this.currentTab === 'favorites') {
      filtered = filtered.filter(m => this.favoriteIds.includes(m.id));
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(m => m.name.toLowerCase().includes(term));
    }

    return filtered;
  }

  openWorkspace(moduleId: string) {
    this.router.navigate(['/workspace', moduleId]);
  }
}
