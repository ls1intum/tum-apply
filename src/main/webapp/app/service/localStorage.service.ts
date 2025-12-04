import { Injectable, Signal, signal } from '@angular/core';
import { ApplicationCreationPage1Data } from 'app/application/application-creation/application-creation-page1/application-creation-page1.component';

export interface ApplicationDraftData {
  personalInfoData: ApplicationCreationPage1Data;
  applicationId: string;
  jobId: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  readonly APPLICATION_DRAFT_VALIDITY_DURATION_IN_DAYS = 30;
  readonly SIDEBAR_STATE_KEY = 'sidebarCollapsed';
  private collapsed = signal<boolean>(this.loadSidebarState());

  // =======================================================
  // STORING APPLICATION DRAFT DATA
  // =======================================================

  saveApplicationDraft(data: ApplicationDraftData): void {
    const key = this.getApplicationKey(data.applicationId, data.jobId);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
      throw new Error('Failed to save application data locally.');
    }
  }

  loadApplicationDraft(applicationId?: string, jobId?: string): ApplicationDraftData | null {
    const key = this.getApplicationKey(applicationId, jobId);
    const savedData = localStorage.getItem(key);
    if (!savedData) return null;

    const parsed = JSON.parse(savedData) as ApplicationDraftData;

    // Check if draft is expired (older than 30 days)
    const now = new Date();
    const saved = new Date(parsed.timestamp);
    const daysDiff = (now.getTime() - saved.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > this.APPLICATION_DRAFT_VALIDITY_DURATION_IN_DAYS) {
      this.clearApplicationDraft(applicationId, jobId);
      return null;
    }

    return parsed;
  }

  clearApplicationDraft(applicationId?: string, jobId?: string): void {
    const key = this.getApplicationKey(applicationId, jobId);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }
  // =======================================================
  // SIDEBAR STATE MANAGEMENT
  // =======================================================
  getSidebarState(): Signal<boolean> {
    return this.collapsed.asReadonly();
  }

  setSidebarState(collapsed: boolean): void {
    this.collapsed.set(collapsed);
    localStorage.setItem(this.SIDEBAR_STATE_KEY, JSON.stringify(collapsed));
  }
  private loadSidebarState(): boolean {
    const stored = localStorage.getItem(this.SIDEBAR_STATE_KEY);
    return stored ? JSON.parse(stored) : false;
  }

  private getApplicationKey(applicationId?: string, jobId?: string): string {
    if (applicationId) return `application_draft_${applicationId}`;
    if (jobId) return `application_draft_job_${jobId}`;
    throw new Error('Either applicationId or jobId is required.');
  }
}
