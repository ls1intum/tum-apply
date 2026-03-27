import { SortOption } from 'app/shared/components/atoms/sorting/sorting';
import { ApplicationDetailDTOApplicationStateEnum } from 'app/generated/model/application-detail-dto';

import { FilterField, FilterOption } from '../shared/filter';

export const filterFields: FilterField[] = [
  new FilterField('evaluation.filterOptions.job', 'job', [], []),
  new FilterField(
    'evaluation.filterOptions.status',
    'status',
    [
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.InReview, 'evaluation.statusBadge.IN_REVIEW'),
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.Sent, 'evaluation.statusBadge.SENT'),
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.Accepted, 'evaluation.statusBadge.ACCEPTED'),
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.Rejected, 'evaluation.statusBadge.REJECTED'),
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.Interview, 'evaluation.statusBadge.INTERVIEW'),
      new FilterOption('', ApplicationDetailDTOApplicationStateEnum.JobClosed, 'evaluation.statusBadge.JOB_CLOSED'),
    ],
    [],
  ),
];

export const availableStatusOptions: { key: string; label: string }[] = [
  { key: ApplicationDetailDTOApplicationStateEnum.Sent, label: 'evaluation.statusBadge.SENT' },
  { key: ApplicationDetailDTOApplicationStateEnum.InReview, label: 'evaluation.statusBadge.IN_REVIEW' },
  { key: ApplicationDetailDTOApplicationStateEnum.Interview, label: 'evaluation.statusBadge.INTERVIEW' },
  { key: ApplicationDetailDTOApplicationStateEnum.Accepted, label: 'evaluation.statusBadge.ACCEPTED' },
  { key: ApplicationDetailDTOApplicationStateEnum.Rejected, label: 'evaluation.statusBadge.REJECTED' },
  { key: ApplicationDetailDTOApplicationStateEnum.JobClosed, label: 'evaluation.statusBadge.JOB_CLOSED' },
];

export const sortableFields: SortOption[] = [
  { displayName: 'evaluation.tableHeaders.appliedAt', fieldName: 'appliedAt', type: 'NUMBER' },
  { displayName: 'evaluation.tableHeaders.lastName', fieldName: 'name', type: 'TEXT' },
  { displayName: 'evaluation.tableHeaders.status', fieldName: 'status', type: 'TEXT' },
  { displayName: 'evaluation.tableHeaders.job', fieldName: 'job', type: 'TEXT' },
];
