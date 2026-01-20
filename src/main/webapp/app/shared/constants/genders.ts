import { SelectOption } from '../components/atoms/select/select.component';

/**
 * Shared gender options used across the application.
 * These options are used in forms where gender selection is required.
 */
export const selectGender: SelectOption[] = [
  { value: 'female', name: 'genders.female' },
  { value: 'male', name: 'genders.male' },
  { value: 'other', name: 'genders.other' },
];
