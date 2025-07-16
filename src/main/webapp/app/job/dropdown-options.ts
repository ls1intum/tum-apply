import { JobFormDTO } from '../generated';

/**
 * Dropdown options used in the Job Creation Form
 */
export const locations = [
  { name: 'Garching Campus', value: JobFormDTO.LocationEnum.Garching },
  { name: 'Garching Hochbrueck Campus', value: JobFormDTO.LocationEnum.GarchingHochbrueck },
  { name: 'Heilbronn Campus', value: JobFormDTO.LocationEnum.Heilbronn },
  { name: 'Munich Campus', value: JobFormDTO.LocationEnum.Munich },
  { name: 'Straubing Campus', value: JobFormDTO.LocationEnum.Straubing },
  { name: 'Weihenstephan Campus', value: JobFormDTO.LocationEnum.Weihenstephan },
  { name: 'Singapore Campus', value: JobFormDTO.LocationEnum.Singapore },
];
export const fieldsOfStudies = [
  { name: 'Agricultural Engineering', value: 'Agricultural Engineering' },
  { name: 'Aerospace Engineering', value: 'Aerospace Engineering' },
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
export const workloadOptions = [
  { name: '100% (Full-time)', value: 40 },
  { name: '60%', value: 24 },
  { name: '40%', value: 16 },
  { name: '20%', value: 8 },
  { name: '10%', value: 4 },
];
export const contractDurations = [
  { name: '1 year', value: 1 },
  { name: '2 years', value: 2 },
  { name: '3 years', value: 3 },
  { name: '4 years', value: 4 },
  { name: '5+ years', value: 5 },
];
export const fundingTypes = [
  { name: 'University Budget', value: JobFormDTO.FundingTypeEnum.FullyFunded },
  { name: 'Government Funding', value: JobFormDTO.FundingTypeEnum.GovernmentFunded },
  { name: 'Self Funding', value: JobFormDTO.FundingTypeEnum.SelfFunded },
  { name: 'Industry Sponsored', value: JobFormDTO.FundingTypeEnum.IndustrySponsored },
  { name: 'Scholarship', value: JobFormDTO.FundingTypeEnum.Scholarship },
  { name: 'Research Grant', value: JobFormDTO.FundingTypeEnum.ResearchGrant },
];
