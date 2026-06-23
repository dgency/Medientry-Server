export const CHOOSE_YOUR_PATH_SECTION_KEY = 'choose_your_path';
export const FEATURED_MEDICAL_COLLEGES_SECTION_KEY = 'featured_medical_colleges';
export const SUCCESS_STORIES_SECTION_KEY = 'success_stories';
export const LATEST_BLOGS_SECTION_KEY = 'latest_blogs';
export const NOTICES_SECTION_KEY = 'notices';
export const HOMEPAGE_CTA_SECTION_KEY = 'homepage_cta';

export const HOME_SECTION_KEYS = [
  CHOOSE_YOUR_PATH_SECTION_KEY,
  FEATURED_MEDICAL_COLLEGES_SECTION_KEY,
  SUCCESS_STORIES_SECTION_KEY,
  LATEST_BLOGS_SECTION_KEY,
  NOTICES_SECTION_KEY,
  HOMEPAGE_CTA_SECTION_KEY,
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

const LEGACY_HOME_SECTION_KEY_ALIASES: Partial<Record<HomeSectionKey, string[]>> = {
  [FEATURED_MEDICAL_COLLEGES_SECTION_KEY]: ['featured-medical-colleges'],
};

export const getHomeSectionLookupKeys = (sectionKey: HomeSectionKey) => {
  return [sectionKey, ...(LEGACY_HOME_SECTION_KEY_ALIASES[sectionKey] ?? [])];
};
