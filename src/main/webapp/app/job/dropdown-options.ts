import { JobFormDTO } from '../generated/models/job-form-dto';

import { JobFormDTOLocationEnum, JobFormDTOSubjectAreaEnum } from 'app/generated/models/job-form-dto';
const BASIC_INFO_I18N = 'jobCreationForm.basicInformationSection';

export const locations = [
  { value: 'GARCHING', name: `${BASIC_INFO_I18N}.locations.Garching` },
  { value: 'GARCHING_HOCHBRUECK', name: `${BASIC_INFO_I18N}.locations.GarchingHochbrueck` },
  { value: 'HEILBRONN', name: `${BASIC_INFO_I18N}.locations.Heilbronn` },
  { value: 'MUNICH', name: `${BASIC_INFO_I18N}.locations.Munich` },
  { value: 'SINGAPORE', name: `${BASIC_INFO_I18N}.locations.Singapore` },
  { value: 'STRAUBING', name: `${BASIC_INFO_I18N}.locations.Straubing` },
  { value: 'WEIHENSTEPHAN', name: `${BASIC_INFO_I18N}.locations.Weihenstephan` },
];
export const subjectAreas = [
  { value: 'AEROSPACE_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.AerospaceEngineering` },
  { value: 'AGRICULTURAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.AgriculturalEngineering` },
  { value: 'AGRICULTURAL_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.AgriculturalScience` },
  { value: 'ARCHITECTURE', name: `${BASIC_INFO_I18N}.subjectAreas.Architecture` },
  { value: 'ART_HISTORY', name: `${BASIC_INFO_I18N}.subjectAreas.ArtHistory` },
  { value: 'AUTOMOTIVE_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.AutomotiveEngineering` },
  { value: 'BIOENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.Bioengineering` },
  { value: 'BIOCHEMISTRY', name: `${BASIC_INFO_I18N}.subjectAreas.Biochemistry` },
  { value: 'BIOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.Biology` },
  { value: 'BIOMEDICAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.BiomedicalEngineering` },
  { value: 'BIOTECHNOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.Biotechnology` },
  { value: 'CHEMISTRY', name: `${BASIC_INFO_I18N}.subjectAreas.Chemistry` },
  { value: 'COMPUTER_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.ComputerEngineering` },
  { value: 'COMPUTER_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.ComputerScience` },
  { value: 'COMPUTER_VISION', name: `${BASIC_INFO_I18N}.subjectAreas.ComputerVision` },
  { value: 'DATA_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.DataScience` },
  { value: 'ECONOMICS', name: `${BASIC_INFO_I18N}.subjectAreas.Economics` },
  { value: 'EDUCATION_TECHNOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.EducationTechnology` },
  { value: 'ELECTRICAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.ElectricalEngineering` },
  { value: 'ENERGY_SYSTEMS', name: `${BASIC_INFO_I18N}.subjectAreas.EnergySystems` },
  { value: 'ENVIRONMENTAL_BIOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalBiology` },
  { value: 'ENVIRONMENTAL_CHEMISTRY', name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalChemistry` },
  { value: 'ENVIRONMENTAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalEngineering` },
  { value: 'ENVIRONMENTAL_LAW', name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalLaw` },
  { value: 'ENVIRONMENTAL_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.EnvironmentalScience` },
  { value: 'FINANCIAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.FinancialEngineering` },
  { value: 'FOOD_TECHNOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.FoodTechnology` },
  { value: 'GEOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.Geology` },
  { value: 'GEOSCIENCES', name: `${BASIC_INFO_I18N}.subjectAreas.Geosciences` },
  { value: 'INDUSTRIAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.IndustrialEngineering` },
  { value: 'INFORMATION_SYSTEMS', name: `${BASIC_INFO_I18N}.subjectAreas.InformationSystems` },
  { value: 'LIFE_SCIENCES', name: `${BASIC_INFO_I18N}.subjectAreas.LifeSciences` },
  { value: 'LINGUISTICS', name: `${BASIC_INFO_I18N}.subjectAreas.Linguistics` },
  { value: 'MARINE_BIOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.MarineBiology` },
  { value: 'MATERIALS_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.MaterialsScience` },
  { value: 'MATHEMATICS', name: `${BASIC_INFO_I18N}.subjectAreas.Mathematics` },
  { value: 'MECHANICAL_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.MechanicalEngineering` },
  { value: 'MEDICAL_INFORMATICS', name: `${BASIC_INFO_I18N}.subjectAreas.MedicalInformatics` },
  { value: 'NEUROSCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.Neuroscience` },
  { value: 'PHILOSOPHY', name: `${BASIC_INFO_I18N}.subjectAreas.Philosophy` },
  { value: 'PHYSICS', name: `${BASIC_INFO_I18N}.subjectAreas.Physics` },
  { value: 'PSYCHOLOGY', name: `${BASIC_INFO_I18N}.subjectAreas.Psychology` },
  { value: 'SOFTWARE_ENGINEERING', name: `${BASIC_INFO_I18N}.subjectAreas.SoftwareEngineering` },
  { value: 'SPORTS_SCIENCE', name: `${BASIC_INFO_I18N}.subjectAreas.SportsScience` },
  { value: 'STATISTICS', name: `${BASIC_INFO_I18N}.subjectAreas.Statistics` },
  { value: 'TELECOMMUNICATIONS', name: `${BASIC_INFO_I18N}.subjectAreas.Telecommunications` },
  { value: 'URBAN_PLANNING', name: `${BASIC_INFO_I18N}.subjectAreas.UrbanPlanning` },
];
export const fundingTypes = [
  { value: 'FULLY_FUNDED', name: `${BASIC_INFO_I18N}.fundingTypes.FullyFunded` },
  { value: 'GOVERNMENT_FUNDED', name: `${BASIC_INFO_I18N}.fundingTypes.GovernmentFunded` },
  { value: 'INDUSTRY_SPONSORED', name: `${BASIC_INFO_I18N}.fundingTypes.IndustrySponsored` },
  { value: 'RESEARCH_GRANT', name: `${BASIC_INFO_I18N}.fundingTypes.ResearchGrant` },
  { value: 'SCHOLARSHIP', name: `${BASIC_INFO_I18N}.fundingTypes.Scholarship` },
  { value: 'SELF_FUNDED', name: `${BASIC_INFO_I18N}.fundingTypes.SelfFunded` },
  { value: 'PARTIALLY_FUNDED', name: `${BASIC_INFO_I18N}.fundingTypes.PartiallyFunded` },
];

export const locationNameToValueMap = new Map(locations.map(option => [option.name, option.value]));
export const locationValueToNameMap = new Map(locations.map(option => [option.value as string, option.name]));
export const subjectAreaNameToValueMap = new Map(subjectAreas.map(option => [option.name, option.value]));
export const subjectAreaValueToNameMap = new Map(subjectAreas.map(option => [option.value as string, option.name]));
export const fundingTypeValueToNameMap = new Map(fundingTypes.map(option => [option.value as string, option.name]));

export function mapLocationNames(translationKeys: string[]): JobFormDTOLocationEnum[] {
  return translationKeys
    .map(key => locationNameToValueMap.get(key))
    .filter((value): value is JobFormDTOLocationEnum => value !== undefined);
}

export function mapSubjectAreaNames(translationKeys: string[]): JobFormDTOSubjectAreaEnum[] {
  return translationKeys
    .map(key => subjectAreaNameToValueMap.get(key))
    .filter((value): value is JobFormDTOSubjectAreaEnum => value !== undefined);
}

/**
 * Generic resolver to convert a raw value to its i18n translation key using a provided map.
 * - Returns an empty string when value is null/undefined/blank.
 * - Normalizes input via toEnumString before lookup.
 * - Falls back to normalized value if no mapping exists.
 */
function getTranslationKey(value: string | undefined, valueToNameMap: Map<string, string>): string {
  if (value == null || value.trim() === '') return '';
  const normalized = toEnumString(value);
  if (normalized === '') return '';
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
