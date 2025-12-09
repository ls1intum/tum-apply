import { CommonModule } from '@angular/common';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DialogService } from 'primeng/dynamicdialog';
import { TableLazyLoadEvent } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { ResearchGroupResourceApiService } from 'app/generated/api/researchGroupResourceApi.service';
import { ResearchGroupAdminDTO } from 'app/generated/model/researchGroupAdminDTO';
import { ToastService } from 'app/service/toast-service';
import { ButtonColor, ButtonComponent } from 'app/shared/components/atoms/button/button.component';
import { ConfirmDialog } from 'app/shared/components/atoms/confirm-dialog/confirm-dialog';
import { Filter, FilterChange } from 'app/shared/components/atoms/filter-multiselect/filter-multiselect';
import { Sort, SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { TagComponent } from 'app/shared/components/atoms/tag/tag.component';
import { SearchFilterSortBar } from 'app/shared/components/molecules/search-filter-sort-bar/search-filter-sort-bar';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { TranslateDirective } from 'app/shared/language';
import { ResearchGroupDetailViewComponent } from 'app/usermanagement/research-group/research-group-admin-view/research-group-detail-view/research-group-detail-view.component';
import { ResearchGroupCreationFormComponent } from 'app/shared/components/molecules/research-group-creation-form/research-group-creation-form.component';
import { ResearchGroupAddMembersComponent } from 'app/usermanagement/research-group/research-group-add-members/research-group-add-members.component';

const I18N_BASE = 'researchGroup.adminView';

@Component({
  selector: 'jhi-research-group-admin-view',
  imports: [
    ButtonComponent,
    CommonModule,
    TagComponent,
    TranslateModule,
    TranslateDirective,
    SearchFilterSortBar,
    DynamicTableComponent,
    ConfirmDialog,
  ],
  templateUrl: './research-group-admin-view.component.html',
})
export class ResearchGroupAdminView {
  researchGroups = signal<ResearchGroupAdminDTO[]>([]);
  totalRecords = signal<number>(0);
  page = signal<number>(0);
  pageSize = signal<number>(10);
  searchQuery = signal<string>('');

  sortBy = signal<string>('state');
  sortDirection = signal<'ASC' | 'DESC'>('DESC');

  readonly availableStatusOptions: { key: string; label: string }[] = [
    { key: 'DRAFT', label: `${I18N_BASE}.groupState.draft` },
    { key: 'ACTIVE', label: `${I18N_BASE}.groupState.active` },
    { key: 'DENIED', label: `${I18N_BASE}.groupState.denied` },
  ];

  readonly stateTextMap = computed<Record<string, string>>(() =>
    this.availableStatusOptions.reduce<Record<string, string>>((acc, cur) => {
      acc[cur.key] = cur.label;
      return acc;
    }, {}),
  );

  readonly availableStatusLabels = this.availableStatusOptions.map(option => option.label);

  readonly stateSeverityMap = signal<Record<string, ButtonColor>>({
    DRAFT: 'contrast',
    ACTIVE: 'success',
    DENIED: 'danger',
  });

  readonly buttonTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');
  readonly stateTemplate = viewChild.required<TemplateRef<unknown>>('stateTemplate');

  readonly selectedStatusFilters = signal<('DRAFT' | 'ACTIVE' | 'DENIED')[]>([]);

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const stateTpl = this.stateTemplate();
    const buttonTpl = this.buttonTemplate();

    return [
      { field: 'professorName', header: `${I18N_BASE}.tableColumn.professor`, width: '20rem' },
      {
        field: 'status',
        header: `${I18N_BASE}.tableColumn.status`,
        width: '6rem',
        alignCenter: true,
        template: stateTpl,
      },
      { field: 'researchGroup', header: `${I18N_BASE}.tableColumn.researchGroup`, width: '30rem' },
      { field: 'createdAt', header: `${I18N_BASE}.tableColumn.requestedAt`, type: 'date', width: '16rem' },
      { field: 'actions', header: '', width: '5rem', template: buttonTpl },
    ];
  });

  readonly filters: Filter[] = [
    {
      filterId: 'status',
      filterLabel: `${I18N_BASE}.filter.status`,
      filterSearchPlaceholder: `${I18N_BASE}.filter.stateSearchPlaceholder`,
      filterOptions: this.availableStatusLabels,
      shouldTranslateOptions: true,
    },
  ];

  readonly sortableFields: SortOption[] = [
    { displayName: `${I18N_BASE}.tableColumn.status`, fieldName: 'state', type: 'TEXT' },
    { displayName: `${I18N_BASE}.tableColumn.requestedAt`, fieldName: 'createdAt', type: 'NUMBER' },
  ];

  private toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private researchGroupService = inject(ResearchGroupResourceApiService);
  private readonly dialogService = inject(DialogService);

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize()));
    const size = event.rows ?? this.pageSize();

    this.page.set(page);
    this.pageSize.set(size);
    void this.loadResearchGroups();
  }

  onSearchEmit(searchQuery: string): void {
    if (searchQuery !== this.searchQuery()) {
      this.page.set(0);
      this.searchQuery.set(searchQuery);
      void this.loadResearchGroups();
    }
  }

  onFilterEmit(filterChange: FilterChange): void {
    if (filterChange.filterId === 'status') {
      this.page.set(0);
      const selectedKeys = this.mapTranslationKeysToEnumValues(filterChange.selectedValues);
      this.selectedStatusFilters.set(selectedKeys);
      void this.loadResearchGroups();
    }
  }

  loadOnSortEmit(event: Sort): void {
    this.page.set(0);
    this.sortBy.set(event.field);
    this.sortDirection.set(event.direction);
    void this.loadResearchGroups();
  }

  onViewResearchGroup(researchGroupId: string): void {
    this.dialogService.open(ResearchGroupDetailViewComponent, {
      header: this.translate.instant('researchGroup.detailView.title'),
      data: { researchGroupId },
      styleClass: 'research-group-detail-dialog',
      style: { background: 'var(--color-background-default)', maxWidth: '50rem' },
      closable: true,
      modal: true,
    });
  }

  onCreateResearchGroup(): void {
    const dialogRef = this.dialogService.open(ResearchGroupCreationFormComponent, {
      header: this.translate.instant('researchGroup.adminView.createDialog.title'),
      data: { mode: 'admin' },
      styleClass: 'research-group-create-dialog',
      style: { background: 'var(--color-background-default)', maxWidth: '50rem' },
      closable: true,
      modal: true,
    });

    dialogRef?.onClose.subscribe(result => {
      if (result === true) {
        void this.loadResearchGroups();
      }
    });
  }

  onAddMembers(researchGroupId: string): void {
    const ref = this.dialogService.open(ResearchGroupAddMembersComponent, {
      header: this.translate.instant('researchGroup.members.addMembers'),
      data: { researchGroupId },
      styleClass: 'research-group-add-members-dialog',
      style: { background: 'var(--color-background-default)', width: '60rem', maxWidth: '60rem' },
      draggable: false,
      closable: true,
      modal: true,
    });

    ref?.onClose.subscribe((success: boolean) => {
      if (success) {
        void this.loadResearchGroups();
      }
    });
  }

  async onApproveResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.activateResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.approve`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.approve`);
    }
  }

  async onDenyResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.denyResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.deny`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.deny`);
    }
  }

  async onWithdrawResearchGroup(researchGroupId: string): Promise<void> {
    try {
      await firstValueFrom(this.researchGroupService.withdrawResearchGroup(researchGroupId));
      this.toastService.showSuccessKey(`${I18N_BASE}.success.withdraw`);
      await this.loadResearchGroups();
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.withdraw`);
    }
  }

  private mapTranslationKeysToEnumValues(translationKeys: string[]): ('DRAFT' | 'ACTIVE' | 'DENIED')[] {
    const keyMap = new Map(this.availableStatusOptions.map(option => [option.label, option.key]));
    return translationKeys.map(key => (keyMap.get(key) ?? key) as 'DRAFT' | 'ACTIVE' | 'DENIED');
  }

  private async loadResearchGroups(): Promise<void> {
    try {
      const pageData = await firstValueFrom(
        this.researchGroupService.getResearchGroupsForAdmin(
          this.pageSize(),
          this.page(),
          this.selectedStatusFilters(),
          this.searchQuery(),
          this.sortBy(),
          this.sortDirection(),
        ),
      );
      this.researchGroups.set(pageData.content ?? []);
      this.totalRecords.set(pageData.totalElements ?? 0);
    } catch {
      this.toastService.showErrorKey(`${I18N_BASE}.errors.loadResearchGroups`);
    }
  }
}
