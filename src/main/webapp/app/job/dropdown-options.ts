import { JobFormDTO } from '../generated/model/jobFormDTO';

/**
 * Dropdown options used in the Job Creation Form
 */
export const locations = [
  { value: JobFormDTO.LocationEnum.Garching, name: 'jobCreationForm.basicInformationSection.locations.Garching' },
  { value: JobFormDTO.LocationEnum.GarchingHochbrueck, name: 'jobCreationForm.basicInformationSection.locations.GarchingHochbrueck' },
  { value: JobFormDTO.LocationEnum.Heilbronn, name: 'jobCreationForm.basicInformationSection.locations.Heilbronn' },
  { value: JobFormDTO.LocationEnum.Munich, name: 'jobCreationForm.basicInformationSection.locations.Munich' },
  { value: JobFormDTO.LocationEnum.Singapore, name: 'jobCreationForm.basicInformationSection.locations.Singapore' },
  { value: JobFormDTO.LocationEnum.Straubing, name: 'jobCreationForm.basicInformationSection.locations.Straubing' },
  { value: JobFormDTO.LocationEnum.Weihenstephan, name: 'jobCreationForm.basicInformationSection.locations.Weihenstephan' },
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
  { value: JobFormDTO.FundingTypeEnum.FullyFunded, name: 'jobCreationForm.basicInformationSection.fundingTypes.FullyFunded' },
  { value: JobFormDTO.FundingTypeEnum.GovernmentFunded, name: 'jobCreationForm.basicInformationSection.fundingTypes.GovernmentFunded' },
  { value: JobFormDTO.FundingTypeEnum.IndustrySponsored, name: 'jobCreationForm.basicInformationSection.fundingTypes.IndustrySponsored' },
  { value: JobFormDTO.FundingTypeEnum.ResearchGrant, name: 'jobCreationForm.basicInformationSection.fundingTypes.ResearchGrant' },
  { value: JobFormDTO.FundingTypeEnum.Scholarship, name: 'jobCreationForm.basicInformationSection.fundingTypes.Scholarship' },
  { value: JobFormDTO.FundingTypeEnum.SelfFunded, name: 'jobCreationForm.basicInformationSection.fundingTypes.SelfFunded' },
];

export const locationNameToValueMap = new Map(locations.map(option => [option.name, option.value]));

export function mapLocationNames(translationKeys: string[]): JobFormDTO.LocationEnum[] {
  return translationKeys
    .map(key => locationNameToValueMap.get(key))
    .filter((value): value is JobFormDTO.LocationEnum => value !== undefined);
}
