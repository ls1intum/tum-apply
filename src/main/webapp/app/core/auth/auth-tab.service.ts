import { Injectable, Signal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthTabService {
  private selectedTab = signal<number>(0);

  getSelectedTab(): Signal<number> {
    return this.selectedTab;
  }

  setSelectedTab(tab: number): void {
    this.selectedTab.set(tab);
  }
}
