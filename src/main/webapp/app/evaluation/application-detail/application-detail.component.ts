import { Component, model } from '@angular/core';

import { FilterOption, FilterSelectComponent } from '../../shared/components/atoms/filter-select/filter-select.component';
import { FilterDialogComponent, FilterField } from '../../shared/components/molecules/filter-dialog/filter-dialog.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';

@Component({
  selector: 'jhi-application-detail',
  imports: [FilterSelectComponent, ButtonComponent, FilterDialogComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  MOCK_FILTER_OPTIONS: FilterOption[] = [
    { displayName: 'Status: Open', field: 'status_open' },
    { displayName: 'Status: Closed', field: 'status_closed' },
    { displayName: 'Priority: High', field: 'priority_high' },
    { displayName: 'Priority: Low', field: 'priority_low' },
    { displayName: 'Category: Bug', field: 'category_bug' },
    { displayName: 'Category: Feature', field: 'category_feature' },
  ];

  // Example pre-selected filters
  MOCK_PRESELECTED_FILTERS: FilterOption[] = [
    { displayName: 'Status: Open', field: 'status_open' },
    { displayName: 'Priority: High', field: 'priority_high' },
  ];

  visible = model(false);

  filterFields: FilterField[] = [
    {
      displayName: 'Job',
      field: 'job',
      options: [
        { displayName: 'Software Engineer', field: 'software_engineer' },
        { displayName: 'Data Scientist', field: 'data_scientist' },
        { displayName: 'Project Manager', field: 'project_manager' },
      ],
      selected: [{ displayName: 'Project Manager', field: 'project_manager' }],
    },
    {
      displayName: 'Status',
      field: 'status',
      options: [
        { displayName: 'Open', field: 'open' },
        { displayName: 'In Progress', field: 'in_progress' },
        { displayName: 'Closed', field: 'closed' },
      ],
      selected: [
        { displayName: 'Open', field: 'open' },
        { displayName: 'In Progress', field: 'in_progress' },
      ],
    },
    {
      displayName: 'Degree',
      field: 'degree',
      options: [
        { displayName: 'Bachelor', field: 'bachelor' },
        { displayName: 'Master', field: 'master' },
        { displayName: 'PhD', field: 'phd' },
      ],
      selected: [],
    },
  ];
}
