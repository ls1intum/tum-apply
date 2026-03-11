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
export const subjectAreas = [
  { value: JobFormDTO.SubjectAreaEnum.AerospaceEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.AerospaceEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.AgriculturalEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.AgriculturalEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.Architecture, name: `${BASIC_INFO_I18N}.subjectAreas.Architecture` },
  { value: JobFormDTO.SubjectAreaEnum.ArtHistory, name: `${BASIC_INFO_I18N}.subjectAreas.ArtHistory` },
  { value: JobFormDTO.SubjectAreaEnum.AutomotiveEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.AutomotiveEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.Bioengineering, name: `${BASIC_INFO_I18N}.subjectAreas.Bioengineering` },
  { value: JobFormDTO.SubjectAreaEnum.Biology, name: `${BASIC_INFO_I18N}.subjectAreas.Biology` },
  { value: JobFormDTO.SubjectAreaEnum.Biotechnology, name: `${BASIC_INFO_I18N}.subjectAreas.Biotechnology` },
  { value: JobFormDTO.SubjectAreaEnum.Chemistry, name: `${BASIC_INFO_I18N}.subjectAreas.Chemistry` },
  { value: JobFormDTO.SubjectAreaEnum.ComputerEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.ComputerEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.ComputerScience, name: `${BASIC_INFO_I18N}.subjectAreas.ComputerScience` },
  { value: JobFormDTO.SubjectAreaEnum.DataScience, name: `${BASIC_INFO_I18N}.subjectAreas.DataScience` },
  { value: JobFormDTO.SubjectAreaEnum.Economics, name: `${BASIC_INFO_I18N}.subjectAreas.Economics` },
  { value: JobFormDTO.SubjectAreaEnum.EducationTechnology, name: `${BASIC_INFO_I18N}.subjectAreas.EducationTechnology` },
  { value: JobFormDTO.SubjectAreaEnum.ElectricalEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.ElectricalEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.EnvironmentalBiology, name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalBiology` },
  { value: JobFormDTO.SubjectAreaEnum.EnvironmentalChemistry, name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalChemistry` },
  { value: JobFormDTO.SubjectAreaEnum.EnvironmentalEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.EnvironmentalScience, name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalScience` },
  { value: JobFormDTO.SubjectAreaEnum.FinancialEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.FinancialEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.FoodTechnology, name: `${BASIC_INFO_I18N}.subjectAreas.FoodTechnology` },
  { value: JobFormDTO.SubjectAreaEnum.Geology, name: `${BASIC_INFO_I18N}.subjectAreas.Geology` },
  { value: JobFormDTO.SubjectAreaEnum.Geosciences, name: `${BASIC_INFO_I18N}.subjectAreas.Geosciences` },
  { value: JobFormDTO.SubjectAreaEnum.IndustrialEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.IndustrialEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.InformationSystems, name: `${BASIC_INFO_I18N}.subjectAreas.InformationSystems` },
  { value: JobFormDTO.SubjectAreaEnum.Linguistics, name: `${BASIC_INFO_I18N}.subjectAreas.Linguistics` },
  { value: JobFormDTO.SubjectAreaEnum.MarineBiology, name: `${BASIC_INFO_I18N}.subjectAreas.MarineBiology` },
  { value: JobFormDTO.SubjectAreaEnum.MaterialsScience, name: `${BASIC_INFO_I18N}.subjectAreas.MaterialsScience` },
  { value: JobFormDTO.SubjectAreaEnum.Mathematics, name: `${BASIC_INFO_I18N}.subjectAreas.Mathematics` },
  { value: JobFormDTO.SubjectAreaEnum.MechanicalEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.MechanicalEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.MedicalInformatics, name: `${BASIC_INFO_I18N}.subjectAreas.MedicalInformatics` },
  { value: JobFormDTO.SubjectAreaEnum.Neuroscience, name: `${BASIC_INFO_I18N}.subjectAreas.Neuroscience` },
  { value: JobFormDTO.SubjectAreaEnum.Philosophy, name: `${BASIC_INFO_I18N}.subjectAreas.Philosophy` },
  { value: JobFormDTO.SubjectAreaEnum.Physics, name: `${BASIC_INFO_I18N}.subjectAreas.Physics` },
  { value: JobFormDTO.SubjectAreaEnum.Psychology, name: `${BASIC_INFO_I18N}.subjectAreas.Psychology` },
  { value: JobFormDTO.SubjectAreaEnum.SoftwareEngineering, name: `${BASIC_INFO_I18N}.subjectAreas.SoftwareEngineering` },
  { value: JobFormDTO.SubjectAreaEnum.SportsScience, name: `${BASIC_INFO_I18N}.subjectAreas.SportsScience` },
  { value: JobFormDTO.SubjectAreaEnum.Telecommunications, name: `${BASIC_INFO_I18N}.subjectAreas.Telecommunications` },
  { value: JobFormDTO.SubjectAreaEnum.UrbanPlanning, name: `${BASIC_INFO_I18N}.subjectAreas.UrbanPlanning` },
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
export const subjectAreaNameToValueMap = new Map(subjectAreas.map(option => [option.name, option.value]));
export const subjectAreaValueToNameMap = new Map(subjectAreas.map(option => [option.value as string, option.name]));
export const fundingTypeValueToNameMap = new Map(fundingTypes.map(option => [option.value as string, option.name]));

export function mapLocationNames(translationKeys: string[]): JobFormDTO.LocationEnum[] {
  return translationKeys
    .map(key => locationNameToValueMap.get(key))
    .filter((value): value is JobFormDTO.LocationEnum => value !== undefined);
}

export function mapSubjectAreaNames(translationKeys: string[]): JobFormDTO.SubjectAreaEnum[] {
  return translationKeys
    .map(key => subjectAreaNameToValueMap.get(key))
    .filter((value): value is JobFormDTO.SubjectAreaEnum => value !== undefined);
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

export function getSubjectAreaTranslationKey(subjectArea: string | undefined): string {
  return getTranslationKey(subjectArea, subjectAreaValueToNameMap);
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
