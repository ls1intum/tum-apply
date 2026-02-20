import { SortOption } from 'app/shared/components/atoms/sorting/sorting';

import { FilterField, FilterOption } from '../shared/filter';

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
      new FilterOption('', 'INTERVIEW', 'evaluation.statusBadge.INTERVIEW'),
    ],
    [],
  ),
];

export const availableStatusOptions: { key: string; label: string }[] = [
  { key: 'SENT', label: 'evaluation.statusBadge.SENT' },
  { key: 'IN_REVIEW', label: 'evaluation.statusBadge.IN_REVIEW' },
  { key: 'INTERVIEW', label: 'evaluation.statusBadge.INTERVIEW' },
  { key: 'ACCEPTED', label: 'evaluation.statusBadge.ACCEPTED' },
  { key: 'REJECTED', label: 'evaluation.statusBadge.REJECTED' },
];

export const sortableFields: SortOption[] = [
  { displayName: 'evaluation.tableHeaders.appliedAt', fieldName: 'appliedAt', type: 'NUMBER' },
  { displayName: 'evaluation.tableHeaders.lastName', fieldName: 'name', type: 'TEXT' },
  { displayName: 'evaluation.tableHeaders.status', fieldName: 'status', type: 'TEXT' },
  { displayName: 'evaluation.tableHeaders.job', fieldName: 'job', type: 'TEXT' },
];
