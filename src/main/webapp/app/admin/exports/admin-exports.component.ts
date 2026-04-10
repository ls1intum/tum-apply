import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { TranslateDirective } from 'app/shared/language';
import { ToastService } from 'app/service/toast-service';

import { AdminExportService } from './admin-export.service';
import { AdminExportType } from './admin-export.model';

interface ExportButton {
  type: AdminExportType;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

interface ExportSection {
  titleKey: string;
  buttons: ExportButton[];
}

/**
 * Admin "Bulk Exports" page. Each button triggers a synchronous backend
 * download — the browser receives the ZIP as soon as it has been built and
 * the user gets a regular download dialog. No background queue, no email,
 * no recent-exports panel.
 */
@Component({
  selector: 'jhi-admin-exports',
  standalone: true,
  imports: [CommonModule, TranslateModule, TranslateDirective, ButtonComponent],
  templateUrl: './admin-exports.component.html',
  styleUrl: './admin-exports.component.scss',
})
export class AdminExportsComponent {
  /** Tracks which buttons are currently downloading (one signal per type). */
  readonly busy = signal<Set<AdminExportType>>(new Set());

  /** Static section/button definitions rendered by the template. */
  readonly sections: ExportSection[] = [
    {
      titleKey: 'adminExports.sections.jobs',
      buttons: [
        {
          type: 'JOBS_OPEN',
          labelKey: 'adminExports.buttons.jobsOpen.label',
          descriptionKey: 'adminExports.buttons.jobsOpen.description',
          icon: 'database',
        },
        {
          type: 'JOBS_EXPIRED',
          labelKey: 'adminExports.buttons.jobsExpired.label',
          descriptionKey: 'adminExports.buttons.jobsExpired.description',
          icon: 'database',
        },
        {
          type: 'JOBS_CLOSED',
          labelKey: 'adminExports.buttons.jobsClosed.label',
          descriptionKey: 'adminExports.buttons.jobsClosed.description',
          icon: 'database',
        },
      ],
    },
    {
      titleKey: 'adminExports.sections.full',
      buttons: [
        {
          type: 'FULL_ADMIN',
          labelKey: 'adminExports.buttons.full.label',
          descriptionKey: 'adminExports.buttons.full.description',
          icon: 'database',
        },
      ],
    },
  ];

  private readonly api = inject(AdminExportService);
  private readonly toastService = inject(ToastService);

  /**
   * Triggers a download for the given type. The button stays in a loading
   * state for the entire build + transfer, then a regular browser download
   * fires once the response Blob has arrived.
   */
  async download(type: AdminExportType): Promise<void> {
    if (this.busy().has(type)) return;
    this.markBusy(type, true);
    try {
      const response = await firstValueFrom(this.api.download(type));
      const blob = response.body;
      if (!blob) {
        this.toastService.showErrorKey('adminExports.toast.downloadError');
        return;
      }
      const filename = this.parseFilename(response.headers.get('Content-Disposition')) ?? `admin-export-${type.toLowerCase()}.zip`;
      this.triggerBrowserDownload(blob, filename);
    } catch {
      this.toastService.showErrorKey('adminExports.toast.downloadError');
    } finally {
      this.markBusy(type, false);
    }
  }

  private markBusy(type: AdminExportType, busy: boolean): void {
    const next = new Set(this.busy());
    if (busy) {
      next.add(type);
    } else {
      next.delete(type);
    }
    this.busy.set(next);
  }

  private parseFilename(contentDisposition: string | null): string | undefined {
    if (contentDisposition === null) return undefined;
    return /filename="([^"]+)"/.exec(contentDisposition)?.[1];
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
