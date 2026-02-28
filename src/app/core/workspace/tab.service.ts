import { Injectable, Type } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TabItem {
  id: string;
  title: string;
  componentType?: Type<any>;
  componentName?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class TabService {
  private tabsSource = new BehaviorSubject<TabItem[]>([]);
  public tabs$ = this.tabsSource.asObservable();

  private activeTabIndexSource = new BehaviorSubject<number>(0);
  public activeTabIndex$ = this.activeTabIndexSource.asObservable();

  constructor() {}

  get tabs(): TabItem[] {
    return this.tabsSource.value;
  }

  addTab(tab: TabItem) {
    const currentTabs = this.tabs;
    const existingIndex = currentTabs.findIndex(t => t.id === tab.id);

    if (existingIndex !== -1) {
      this.activeTabIndexSource.next(existingIndex);
    } else {
      const newTabs = [...currentTabs, tab];
      this.tabsSource.next(newTabs);
      this.activeTabIndexSource.next(newTabs.length - 1);
    }
  }

  removeTab(index: number) {
    const currentTabs = this.tabs;
    currentTabs.splice(index, 1);
    this.tabsSource.next([...currentTabs]);

    const activeIndex = this.activeTabIndexSource.value;
    if (activeIndex >= currentTabs.length) {
      this.activeTabIndexSource.next(Math.max(0, currentTabs.length - 1));
    }
  }

  setActiveTab(index: number) {
    this.activeTabIndexSource.next(index);
  }

  clearTabs() {
    this.tabsSource.next([]);
    this.activeTabIndexSource.next(0);
  }
}
