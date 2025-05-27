// i18n.ts
import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import da from './locales/da.json';

// Create i18n instance with translations
const i18n = new I18n({
  en,
  da,
});

// Get the best language tag (e.g., 'da-DK', 'en-US')
const bestLocale = Localization.getLocales()[0]?.languageCode ?? 'en';

// Set locale and enable fallback
i18n.locale = bestLocale;
i18n.enableFallback = true;

export default i18n;
