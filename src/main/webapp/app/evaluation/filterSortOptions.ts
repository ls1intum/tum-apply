import { FilterField, SortOption } from '../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';

// TODO Jobs will be replaced by dynamically loaded jobs from the server
export const filterFields: FilterField[] = [
  {
    translationKey: 'evaluation.filterOptions.job',
    field: 'job',
    options: [],
    selected: [{ displayName: 'Project Manager', field: 'project_manager', translationKey: undefined }],
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
    field: 'createdAt',
    direction: 'ASC',
  },
  {
    displayName: 'Applied at (Newest to Oldest)',
    field: 'createdAt',
    direction: 'DESC',
  },
];
