import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { TableLazyLoadEvent } from 'primeng/table';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { DynamicTableColumn, DynamicTableComponent } from '../../../shared/components/organisms/dynamic-table/dynamic-table.component';
import { EmailTemplateOverviewDTO } from '../../../generated';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import TranslateDirective from '../../../shared/language/translate.directive';
import { EmailTemplateResourceService } from '../../../generated/api/emailTemplateResource.service';
import { ToastService } from '../../../service/toast-service';
import { ToastComponent } from '../../../shared/toast/toast.component';

@Component({
  selector: 'jhi-research-group-templates',
  imports: [DynamicTableComponent, ButtonComponent, TranslateDirective, ToastComponent],
  templateUrl: './research-group-templates.html',
  styleUrl: './research-group-templates.scss',
})
export class ResearchGroupTemplates {
  protected pageNumber = signal<number>(0);
  protected pageSize = signal<number>(10);
  protected total = signal<number>(0);

  protected readonly emailTemplateService = inject(EmailTemplateResourceService);
  protected readonly toastService = inject(ToastService);
  protected readonly translate = inject(TranslateService);
  protected readonly router = inject(Router);

  protected currentLang = toSignal(this.translate.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translate.currentLang });

  protected readonly editTemplate = viewChild.required<TemplateRef<unknown>>('editTemplate');
  protected readonly deleteTemplate = viewChild.required<TemplateRef<unknown>>('deleteTemplate');

  protected readonly columns = computed<DynamicTableColumn[]>(() => {
    const editTemplate = this.editTemplate();
    const deleteTemplate = this.deleteTemplate();
    return [
      { field: 'displayName', header: `${this.translationKey}.tableColumns.templateName`, width: '28rem' },
      { field: 'createdBy', header: `${this.translationKey}.tableColumns.createdBy`, width: '15rem' },
      { field: '', header: '', width: '1rem', template: editTemplate },
      { field: '', header: '', width: '1rem', template: deleteTemplate },
    ];
  });

  protected readonly translationKey: string = 'researchGroup.emailTemplates';

  protected readonly tableData = computed(() => {
    this.currentLang();
    return this.responseData().map(template => {
      let displayName = template.templateName;
      let createdBy = (template.firstName ?? '') + ' ' + (template.lastName ?? '');

      if (template.isDefault === true) {
        createdBy = this.translate.instant(`${this.translationKey}.systemDefault`);
        if (template.templateName != null) {
          displayName = this.translate.instant(`${this.translationKey}.default.${template.emailType}-${template.templateName}`);
        } else {
          displayName = this.translate.instant(`${this.translationKey}.default.${template.emailType}`);
        }
      }

      return {
        ...template,
        createdBy,
        displayName,
      };
    });
  });

  private readonly responseData = signal<EmailTemplateOverviewDTO[]>([]);

  constructor() {
    void this.loadPage();
  }

  onTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);

    void this.loadPage();
  }

  async delete(templateId: string): Promise<void> {
    try {
      await firstValueFrom(this.emailTemplateService.deleteTemplate(templateId));
      this.toastService.showSuccess({ detail: 'Successfully deleted template' });
    } catch {
      this.toastService.showError({ detail: 'Failed to delete template' });
    } finally {
      void this.loadPage();
    }
  }

  // Navigate to create
  protected navigateToCreate(): void {
    void this.router.navigate(['/research-group/template/new']);
  }

  // Navigate to edit
  protected navigateToEdit(templateId: string): void {
    void this.router.navigate(['/research-group/template', templateId, 'edit']);
  }

  private async loadPage(): Promise<void> {
    try {
      const res = await firstValueFrom(this.emailTemplateService.getTemplates(this.pageSize(), this.pageNumber()));

      this.responseData.set(res.content ?? []);
      this.total.set(res.totalElements ?? 0);
    } catch {
      this.toastService.showError({ detail: 'Failed to load templates' });
    }
  }
}
