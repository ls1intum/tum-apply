import { JobFormDTO } from '../generated/model/jobFormDTO';

/**
 * Dropdown options used in the Job Creation Form
 */
export const locations = [
  { name: 'Garching', value: JobFormDTO.LocationEnum.Garching },
  { name: 'Garching Hochbrueck', value: JobFormDTO.LocationEnum.GarchingHochbrueck },
  { name: 'Heilbronn', value: JobFormDTO.LocationEnum.Heilbronn },
  { name: 'Munich', value: JobFormDTO.LocationEnum.Munich },
  { name: 'Singapore', value: JobFormDTO.LocationEnum.Singapore },
  { name: 'Straubing', value: JobFormDTO.LocationEnum.Straubing },
  { name: 'Weihenstephan', value: JobFormDTO.LocationEnum.Weihenstephan },
];
export const fieldsOfStudies = [
  { name: 'Aerospace Engineering', value: 'Aerospace Engineering' },
  { name: 'Agricultural Engineering', value: 'Agricultural Engineering' },
  { name: 'Architecture', value: 'Architecture' },
  { name: 'Art History', value: 'Art History' },
  { name: 'Automotive Engineering', value: 'Automotive Engineering' },
  { name: 'Bioengineering', value: 'Bioengineering' },
  { name: 'Chemistry', value: 'Chemistry' },
  { name: 'Computer Engineering', value: 'Computer Engineering' },
  { name: 'Computer Science', value: 'Computer Science' },
  { name: 'Economics', value: 'Economics' },
  { name: 'Education Technology', value: 'Education Technology' },
  { name: 'Electrical Engineering', value: 'Electrical Engineering' },
  { name: 'Environmental Engineering', value: 'Environmental Engineering' },
  { name: 'Financial Engineering', value: 'Financial Engineering' },
  { name: 'Food Technology', value: 'Food Technology' },
  { name: 'Geology', value: 'Geology' },
  { name: 'Industrial Engineering', value: 'Industrial Engineering' },
  { name: 'Information Systems', value: 'Information Systems' },
  { name: 'Linguistics', value: 'Linguistics' },
  { name: 'Marine Biology', value: 'Marine Biology' },
  { name: 'Materials Science', value: 'Materials Science' },
  { name: 'Mathematics', value: 'Mathematics' },
  { name: 'Mechanical Engineering', value: 'Mechanical Engineering' },
  { name: 'Medical Informatics', value: 'Medical Informatics' },
  { name: 'Neuroscience', value: 'Neuroscience' },
  { name: 'Philosophy', value: 'Philosophy' },
  { name: 'Physics', value: 'Physics' },
  { name: 'Psychology', value: 'Psychology' },
  { name: 'Software Engineering', value: 'Software Engineering' },
  { name: 'Sports Science', value: 'Sports Science' },
  { name: 'Telecommunications', value: 'Telecommunications' },
  { name: 'Urban Planning', value: 'Urban Planning' },
];
export const fundingTypes = [
  { name: 'Fully Funded', value: JobFormDTO.FundingTypeEnum.FullyFunded },
  { name: 'Government Funding', value: JobFormDTO.FundingTypeEnum.GovernmentFunded },
  { name: 'Industry Sponsored', value: JobFormDTO.FundingTypeEnum.IndustrySponsored },
  { name: 'Research Grant', value: JobFormDTO.FundingTypeEnum.ResearchGrant },
  { name: 'Scholarship', value: JobFormDTO.FundingTypeEnum.Scholarship },
  { name: 'Self Funding', value: JobFormDTO.FundingTypeEnum.SelfFunded },
];

/**
 * Generic function to map translation keys (names) to their corresponding enum values
 * @param names - Array of display names to map
 * @param options - Dropdown options array containing name-value pairs
 * @returns Array of mapped enum values, filtered to exclude undefined values
 */
export function mapNamesToValues<T>(names: string[], options: { name: string; value: T }[]): T[] {
  const keyMap = new Map(options.map(option => [option.name, option.value]));
  return names.map(key => keyMap.get(key)).filter((value): value is T => value !== undefined);
}
