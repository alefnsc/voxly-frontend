/**
 * Language to Countries Mapping
 * 
 * Maps interview languages to countries where jobs in that language
 * are commonly available. Based on official/de-facto languages from
 * Unicode CLDR territory data.
 * 
 * @module lib/geo/languageCountries
 */

export interface Country {
  code: string;
  name: string;
  flag: string;
}

// Comprehensive country list with flags
export const ALL_COUNTRIES: Record<string, Country> = {
  // Africa
  DZ: { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  AO: { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  BJ: { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  BW: { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  BF: { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  BI: { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  CM: { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  CV: { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  CF: { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  TD: { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  KM: { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  CG: { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  CD: { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
  CI: { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  DJ: { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  EG: { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  GQ: { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  ER: { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  SZ: { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  ET: { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  GA: { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  GM: { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  GH: { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  GN: { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  GW: { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  KE: { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  LS: { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  LR: { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  LY: { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  MG: { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  MW: { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  ML: { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  MR: { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  MU: { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  MA: { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  MZ: { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  NA: { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  NE: { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  NG: { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  RW: { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  ST: { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  SN: { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  SC: { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  SL: { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  SO: { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  ZA: { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  SS: { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  SD: { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  TZ: { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  TG: { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  TN: { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  UG: { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  ZM: { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  ZW: { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },

  // Americas
  AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  BS: { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  BB: { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  BZ: { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  BO: { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  CL: { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  CO: { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  CR: { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  CU: { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  DO: { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  EC: { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  SV: { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  GT: { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  GY: { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  HT: { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  HN: { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  JM: { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  MX: { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  NI: { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  PA: { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  PY: { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  PE: { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  PR: { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  SR: { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  TT: { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  UY: { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  VE: { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },

  // Asia
  AF: { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  AM: { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  AZ: { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  BH: { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  BD: { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  BT: { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  BN: { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  KH: { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  CN: { code: 'CN', name: 'China', flag: '🇨🇳' },
  CY: { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  GE: { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  HK: { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
  IN: { code: 'IN', name: 'India', flag: '🇮🇳' },
  ID: { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  IR: { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  IQ: { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  IL: { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  JO: { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  KZ: { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  KW: { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  KG: { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  LA: { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  LB: { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  MO: { code: 'MO', name: 'Macau', flag: '🇲🇴' },
  MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  MV: { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  MN: { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  MM: { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  NP: { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  KP: { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  OM: { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  PK: { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  PS: { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
  PH: { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  QA: { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  SA: { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  LK: { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  SY: { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  TW: { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  TJ: { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  TH: { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  TL: { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  TR: { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  TM: { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  AE: { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  UZ: { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  VN: { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  YE: { code: 'YE', name: 'Yemen', flag: '🇾🇪' },

  // Europe
  AL: { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  AD: { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  AT: { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  BY: { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  BE: { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  BA: { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  BG: { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  HR: { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  CZ: { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  DK: { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  EE: { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  FI: { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  FR: { code: 'FR', name: 'France', flag: '🇫🇷' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  GR: { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  HU: { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  IS: { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  IE: { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  XK: { code: 'XK', name: 'Kosovo', flag: '🇽🇰' },
  LV: { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  LI: { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  LT: { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  LU: { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  MT: { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  MD: { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  MC: { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  ME: { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  MK: { code: 'MK', name: 'North Macedonia', flag: '🇲🇰' },
  NO: { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  PL: { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  PT: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  RO: { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  RU: { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  SM: { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  RS: { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  SK: { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  SI: { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  CH: { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  UA: { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  VA: { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },

  // Oceania
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  FJ: { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  NZ: { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  PG: { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  WS: { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  SB: { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  TO: { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  VU: { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
};

/**
 * Language to countries mapping
 * Based on where each language is official or widely used in business contexts
 */
export const LANGUAGE_TO_COUNTRIES: Record<string, string[]> = {
  // English - Global business language
  en: [
    // Primary English-speaking
    'US', 'GB', 'CA', 'AU', 'NZ', 'IE',
    // Africa
    'ZA', 'NG', 'KE', 'GH', 'UG', 'TZ', 'ZM', 'ZW', 'BW', 'NA', 'MW', 'RW', 'SL', 'GM', 'LR', 'SS', 'LS', 'SZ',
    // Caribbean & Americas
    'JM', 'TT', 'BS', 'BB', 'GY', 'BZ', 'PR',
    // Asia
    'IN', 'PK', 'BD', 'PH', 'SG', 'HK', 'MY',
    // Oceania
    'FJ', 'PG', 'SB', 'VU', 'WS', 'TO',
    // Europe (business language)
    'MT', 'CY',
    // Middle East (business hubs)
    'AE', 'QA', 'BH', 'KW', 'IL',
  ],

  // Chinese (Mandarin/Cantonese)
  zh: [
    'CN', 'TW', 'HK', 'MO', 'SG', 'MY',
  ],

  // Hindi
  hi: [
    'IN', 'NP', 'FJ', 'MU', 'SG', 'AE', 'QA', 'KW', 'BH', 'OM',
  ],

  // Spanish
  es: [
    // Spain
    'ES',
    // Latin America
    'MX', 'CO', 'AR', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY', 'PR',
    // Africa
    'GQ',
    // US (large Spanish-speaking population)
    'US',
  ],

  // Portuguese
  pt: [
    'BR', 'PT', 'AO', 'MZ', 'GW', 'CV', 'ST', 'TL', 'MO',
  ],

  // French
  fr: [
    // Europe
    'FR', 'BE', 'CH', 'LU', 'MC',
    // Canada
    'CA',
    // Africa
    'CD', 'CI', 'CM', 'SN', 'ML', 'NE', 'BF', 'MG', 'CG', 'GA', 'TG', 'BJ', 'RW', 'BI', 'TD', 'CF', 'MR', 'DJ', 'KM', 'SC', 'MU',
    // Caribbean
    'HT',
    // Oceania
    'VU',
  ],

  // Russian
  ru: [
    'RU', 'BY', 'KZ', 'KG', 'TJ', 'UZ', 'TM', 'UA', 'MD', 'AM', 'AZ', 'GE',
    // Baltic states (still widely used)
    'LV', 'LT', 'EE',
  ],
};

/**
 * Get countries for a specific language
 */
export function getCountriesForLanguage(languageCode: string): Country[] {
  const countryCodes = LANGUAGE_TO_COUNTRIES[languageCode] || [];
  return countryCodes
    .map(code => ALL_COUNTRIES[code])
    .filter((country): country is Country => country !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get all countries sorted alphabetically
 */
export function getAllCountries(): Country[] {
  return Object.values(ALL_COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Check if a country is valid for a given language
 */
export function isCountryValidForLanguage(countryCode: string, languageCode: string): boolean {
  const countryCodes = LANGUAGE_TO_COUNTRIES[languageCode] || [];
  return countryCodes.includes(countryCode);
}

/**
 * Get country by code
 */
export function getCountryByCode(countryCode: string): Country | undefined {
  return ALL_COUNTRIES[countryCode];
}

/**
 * Supported interview languages with metadata
 * Uses full locale codes to match backend SupportedLanguageCode
 */
export const INTERVIEW_LANGUAGES = [
  { code: 'en-US', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'pt-BR', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
] as const;

export type InterviewLanguageCode = typeof INTERVIEW_LANGUAGES[number]['code'];
