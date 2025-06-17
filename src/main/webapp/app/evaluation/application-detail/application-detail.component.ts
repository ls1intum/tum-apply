import { Component, model } from '@angular/core';

import {
  FilterField,
  FilterSortBarComponent,
  SortOption,
} from '../../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';

@Component({
  selector: 'jhi-application-detail',
  imports: [FilterSortBarComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  visible = model(false);

  filterFields: FilterField[] = [
    {
      displayName: 'Job',
      field: 'job',
      options: [
        { displayName: 'Software Engineer', field: 'software_engineer', translationKey: 'softwareEngineerKey' },
        { displayName: 'Data Scientist', field: 'data_scientist', translationKey: 'dataScientistKey' },
        { displayName: 'Project Manager', field: 'project_manager', translationKey: 'projectManager' },
      ],
      selected: [{ displayName: 'Project Manager', field: 'project_manager', translationKey: 'projectManager' }],
    },
    {
      displayName: 'Status',
      field: 'status',
      options: [
        { displayName: 'Open', field: 'open', translationKey: undefined },
        { displayName: 'In Progress', field: 'in_progress', translationKey: undefined },
        { displayName: 'Closed', field: 'closed', translationKey: undefined },
      ],
      selected: [
        { displayName: 'Open', field: 'open', translationKey: undefined },
        { displayName: 'In Progress', field: 'in_progress', translationKey: undefined },
      ],
    },
    {
      displayName: 'Degree',
      field: 'degree',
      options: [
        { displayName: 'Bachelor', field: 'bachelor', translationKey: undefined },
        { displayName: 'Master', field: 'master', translationKey: undefined },
        { displayName: 'PhD', field: 'phd', translationKey: undefined },
      ],
      selected: [],
    },
  ];

  SORT_OPTIONS: SortOption[] = [
    {
      displayName: 'Rating (Worst to Best)',
      field: 'rating',
      direction: 'ASC',
    },
    {
      displayName: 'Rating (Best to Worst)',
      field: 'rating',
      direction: 'DESC',
    },
    {
      displayName: 'Applied at (Oldest to Newest)',
      field: 'rating',
      direction: 'ASC',
    },
    {
      displayName: 'Applied at (Newest to Oldest)',
      field: 'rating',
      direction: 'DESC',
    },
  ];
}
