import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslateModule } from '@ngx-translate/core';
import { DynamicTableColumn, DynamicTableComponent } from 'app/shared/components/organisms/dynamic-table/dynamic-table.component';
import { DepartmentDTO } from 'app/generated/model/models';
import { TableLazyLoadEvent } from 'primeng/table';
import { DepartmentResourceApiService } from 'app/generated';
import { firstValueFrom } from 'rxjs';
import { ToastService } from 'app/service/toast-service';
import { ButtonComponent } from 'app/shared/components/atoms/button/button.component';

interface DepartmentTableRow {
  departmentId?: string;
  name?: string;
  schoolName?: string;
  schoolAbbreviation?: string;
}

@Component({
  selector: 'jhi-research-group-departments.component',
  imports: [FontAwesomeModule, TranslateModule, DynamicTableComponent, ButtonComponent],
  templateUrl: './research-group-departments.component.html',
})
export class ResearchGroupDepartmentsComponent {
  allDepartments = signal<DepartmentDTO[]>([]);
  pageNumber = signal<number>(0);
  pageSize = signal<number>(10);
  total = signal<number>(0);

  readonly buttonTemplate = viewChild.required<TemplateRef<unknown>>('actionTemplate');

  readonly columns = computed<DynamicTableColumn[]>(() => {
    const buttonTpl = this.buttonTemplate();

    return [
      { field: 'name', header: `${this.translationKey}.tableColumns.name`, width: '16rem' },
      { field: 'schoolName', header: `${this.translationKey}.tableColumns.school`, width: '20rem' },
      { field: 'schoolAbbreviation', header: `${this.translationKey}.tableColumns.schoolAbbreviation`, width: '10rem' },
      { field: 'actions', header: '', width: '5rem', template: buttonTpl },
    ];
  });

  readonly tableData = computed<DepartmentTableRow[]>(() => {
    const start = this.pageNumber() * this.pageSize();
    const end = start + this.pageSize();
    return this.allDepartments()
      .slice(start, end)
      .map(dept => ({
        departmentId: dept.departmentId,
        name: dept.name,
        schoolName: dept.school?.name,
        schoolAbbreviation: dept.school?.abbreviation,
      }));
  });

  private toastService = inject(ToastService);
  private readonly departmentResourceApiService = inject(DepartmentResourceApiService);
  private readonly translationKey: string = 'researchGroup.departments';

  constructor() {
    void this.loadDepartments();
  }

  loadOnTableEmit(event: TableLazyLoadEvent): void {
    const first = event.first ?? 0;
    const rows = event.rows ?? 10;
    this.pageNumber.set(first / rows);
    this.pageSize.set(rows);
  }

  async loadDepartments(): Promise<void> {
    try {
      const departments = await firstValueFrom(this.departmentResourceApiService.getDepartments());
      this.allDepartments.set(departments);
      this.total.set(departments.length);
    } catch {
      this.toastService.showErrorKey(`${this.translationKey}.toastMessages.loadFailed`);
    }
  }

  onViewDepartment(departmentId: string | undefined): void {
    // Placeholder for viewing department details
    console.warn('View department with ID:', departmentId);
  }
}
