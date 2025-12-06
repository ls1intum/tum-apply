import { JobFormDTO } from '../generated/model/jobFormDTO';

const BASIC_INFO_I18N = 'jobCreationForm.basicInformationSection';

export const locations = [
  { value: JobFormDTO.LocationEnum.Garching, name: `${BASIC_INFO_I18N}.locations.Garching` },
  { value: JobFormDTO.LocationEnum.GarchingHochbrueck, name: `${BASIC_INFO_I18N}.locations.GarchingHochbrueck` },
  { value: JobFormDTO.LocationEnum.Heilbronn, name: `${BASIC_INFO_I18N}.locations.Heilbronn` },
  { value: JobFormDTO.LocationEnum.Munich, name: `${BASIC_INFO_I18N}.locations.Munich` },
  { value: JobFormDTO.LocationEnum.Singapore, name: `${BASIC_INFO_I18N}.locations.Singapore` },
  { value: JobFormDTO.LocationEnum.Straubing, name: `${BASIC_INFO_I18N}.locations.Straubing` },
  { value: JobFormDTO.LocationEnum.Weihenstephan, name: `${BASIC_INFO_I18N}.locations.Weihenstephan` },
];
export const fieldsOfStudies = [
  { value: 'Aerospace Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.AerospaceEngineering` },
  { value: 'Agricultural Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.AgriculturalEngineering` },
  { value: 'Architecture', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Architecture` },
  { value: 'Art History', name: `${BASIC_INFO_I18N}.fieldsOfStudies.ArtHistory` },
  { value: 'Automotive Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.AutomotiveEngineering` },
  { value: 'Bioengineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Bioengineering` },
  { value: 'Biology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Biology` },
  { value: 'Biotechnology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Biotechnology` },
  { value: 'Chemistry', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Chemistry` },
  { value: 'Computer Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.ComputerEngineering` },
  { value: 'Computer Science', name: `${BASIC_INFO_I18N}.fieldsOfStudies.ComputerScience` },
  { value: 'Data Science', name: `${BASIC_INFO_I18N}.fieldsOfStudies.DataScience` },
  { value: 'Economics', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Economics` },
  { value: 'Education Technology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.EducationTechnology` },
  { value: 'Electrical Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.ElectricalEngineering` },
  { value: 'Environmental Biology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.EnvironmentalBiology` },
  { value: 'Environmental Chemistry', name: `${BASIC_INFO_I18N}.fieldsOfStudies.EnvironmentalChemistry` },
  { value: 'Environmental Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.EnvironmentalEngineering` },
  { value: 'Environmental Science', name: `${BASIC_INFO_I18N}.fieldsOfStudies.EnvironmentalScience` },
  { value: 'Financial Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.FinancialEngineering` },
  { value: 'Food Technology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.FoodTechnology` },
  { value: 'Geology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Geology` },
  { value: 'Geosciences', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Geosciences` },
  { value: 'Industrial Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.IndustrialEngineering` },
  { value: 'Information Systems', name: `${BASIC_INFO_I18N}.fieldsOfStudies.InformationSystems` },
  { value: 'Linguistics', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Linguistics` },
  { value: 'Marine Biology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.MarineBiology` },
  { value: 'Materials Science', name: `${BASIC_INFO_I18N}.fieldsOfStudies.MaterialsScience` },
  { value: 'Mathematics', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Mathematics` },
  { value: 'Mechanical Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.MechanicalEngineering` },
  { value: 'Medical Informatics', name: `${BASIC_INFO_I18N}.fieldsOfStudies.MedicalInformatics` },
  { value: 'Neuroscience', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Neuroscience` },
  { value: 'Philosophy', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Philosophy` },
  { value: 'Physics', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Physics` },
  { value: 'Psychology', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Psychology` },
  { value: 'Software Engineering', name: `${BASIC_INFO_I18N}.fieldsOfStudies.SoftwareEngineering` },
  { value: 'Sports Science', name: `${BASIC_INFO_I18N}.fieldsOfStudies.SportsScience` },
  { value: 'Telecommunications', name: `${BASIC_INFO_I18N}.fieldsOfStudies.Telecommunications` },
  { value: 'Urban Planning', name: `${BASIC_INFO_I18N}.fieldsOfStudies.UrbanPlanning` },
];
export const fundingTypes = [
  { value: JobFormDTO.FundingTypeEnum.FullyFunded, name: `${BASIC_INFO_I18N}.fundingTypes.FullyFunded` },
  { value: JobFormDTO.FundingTypeEnum.GovernmentFunded, name: `${BASIC_INFO_I18N}.fundingTypes.GovernmentFunded` },
  { value: JobFormDTO.FundingTypeEnum.IndustrySponsored, name: `${BASIC_INFO_I18N}.fundingTypes.IndustrySponsored` },
  { value: JobFormDTO.FundingTypeEnum.ResearchGrant, name: `${BASIC_INFO_I18N}.fundingTypes.ResearchGrant` },
  { value: JobFormDTO.FundingTypeEnum.Scholarship, name: `${BASIC_INFO_I18N}.fundingTypes.Scholarship` },
  { value: JobFormDTO.FundingTypeEnum.SelfFunded, name: `${BASIC_INFO_I18N}.fundingTypes.SelfFunded` },
  { value: JobFormDTO.FundingTypeEnum.PartiallyFunded, name: `${BASIC_INFO_I18N}.fundingTypes.PartiallyFunded` },
];

export const locationNameToValueMap = new Map(locations.map(option => [option.name, option.value]));
export const locationValueToNameMap = new Map(locations.map(option => [option.value as string, option.name]));
export const fundingTypeValueToNameMap = new Map(fundingTypes.map(option => [option.value as string, option.name]));
export const fieldOfStudiesMap = new Map(fieldsOfStudies.map(option => [option.value, option.name]));

export function mapLocationNames(translationKeys: string[]): JobFormDTO.LocationEnum[] {
  return translationKeys
    .map(key => locationNameToValueMap.get(key))
    .filter((value): value is JobFormDTO.LocationEnum => value !== undefined);
}

/**
 * Generic resolver to convert a raw value to its i18n translation key using a provided map.
 * - Returns '-' when value is null/undefined.
 * - Normalizes input via toEnumString before lookup.
 * - Falls back to normalized value if no mapping exists.
 */
function getTranslationKey(value: string | undefined, valueToNameMap: Map<string, string>): string {
  if (value == null) return '-';
  const normalized = toEnumString(value);
  return valueToNameMap.get(normalized) ?? normalized;
}

export function getLocationTranslationKey(location: string | undefined): string {
  return getTranslationKey(location, locationValueToNameMap);
}

export function getFundingTypeTranslationKey(fundingType: string | undefined): string {
  return getTranslationKey(fundingType, fundingTypeValueToNameMap);
}

export function getFieldOfStudiesTranslationKey(fieldOfStudies: string | undefined): string {
  if (fieldOfStudies == null) return '-';
  return fieldOfStudiesMap.get(fieldOfStudies) ?? fieldOfStudies;
}

/**
 * Converts a normal string to its enum format string.
 * @param value - A string (e.g., "Garching Hochbrueck")
 * @returns A string in enum format (e.g., "GARCHING_HOCHBRUECK")
 */
export function toEnumString(value: string): string {
  if (/^[A-Z_]+$/.test(value)) {
    return value;
  }
  return value
    .trim()
    .split(/\s+/)
    .map((part: string) => part.replace(/[^A-Za-z0-9]/g, ''))
    .filter((part: string) => part.length > 0)
    .map((part: string) => part.toUpperCase())
    .join('_');
}
