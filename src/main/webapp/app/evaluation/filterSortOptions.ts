import { FilterField, SortOption } from '../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';

export const filterFields: FilterField[] = [
  {
    translationKey: 'evaluation.filterOptions.job',
    field: 'job',
    options: [
      { displayName: 'Software Engineer', field: 'software_engineer', translationKey: 'softwareEngineerKey' },
      { displayName: 'Data Scientist', field: 'data_scientist', translationKey: 'dataScientistKey' },
      { displayName: 'Project Manager', field: 'project_manager', translationKey: 'projectManager' },
    ],
    selected: [{ displayName: 'Project Manager', field: 'project_manager', translationKey: 'projectManager' }],
  },
  {
    translationKey: 'evaluation.filterOptions.status',
    field: 'status',
    options: [
      { displayName: '', field: 'IN_REVIEW', translationKey: 'evaluation.statusBadge.IN_REVIEW' },
      { displayName: '', field: 'SENT', translationKey: 'evaluation.statusBadge.SENT' },
      { displayName: '', field: 'ACCEPTED', translationKey: 'evaluation.statusBadge.ACCEPTED' },
      { displayName: '', field: 'REJECTED', translationKey: 'evaluation.statusBadge.REJECTED' },
    ],
    selected: [
      { displayName: '', field: 'IN_REVIEW', translationKey: 'evaluation.statusBadge.IN_REVIEW' },
      { displayName: '', field: 'SENT', translationKey: 'evaluation.statusBadge.SENT' },
    ],
  },
];

export const sortOptions: SortOption[] = [
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
