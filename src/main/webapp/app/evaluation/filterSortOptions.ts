import { SortOption } from '../shared/components/molecules/filter-sort-bar/filter-sort-bar.component';
import { FilterField, FilterOption } from '../shared/filter';

// TODO Jobs will be replaced by dynamically loaded jobs from the server
export const filterFields: FilterField[] = [
  new FilterField('evaluation.filterOptions.job', 'job', [], []),
  new FilterField(
    'evaluation.filterOptions.status',
    'status',
    [
      new FilterOption('', 'IN_REVIEW', 'evaluation.statusBadge.IN_REVIEW'),
      new FilterOption('', 'SENT', 'evaluation.statusBadge.SENT'),
      new FilterOption('', 'ACCEPTED', 'evaluation.statusBadge.ACCEPTED'),
      new FilterOption('', 'REJECTED', 'evaluation.statusBadge.REJECTED'),
    ],
    [],
  ),
];

export const sortOptions: SortOption[] = [
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
