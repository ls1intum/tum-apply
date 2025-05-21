import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthTabService {
  private selectedTab = signal<number>(0);

  getSelectedTab() {
    return this.selectedTab;
  }

  setSelectedTab(tab: number) {
    this.selectedTab.set(tab);
  }
}
