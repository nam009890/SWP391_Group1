import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = { vi: {}, en: {} };
const files = import.meta.glob('./locales/*/*.json', { eager: true, import: 'default' });
for (const [path, messages] of Object.entries(files)) {
  const [, language, namespace] = path.match(/locales\/(vi|en)\/([^/]+)\.json$/);
  resources[language][namespace] = messages;
}
const saved = localStorage.getItem('studye.language');
i18n.use(initReactI18next).init({
  resources,
  lng: saved === 'en' ? 'en' : 'vi',
  fallbackLng: 'vi',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});
i18n.on('languageChanged', language => {
  localStorage.setItem('studye.language', language);
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.language;

export const t = (key, options) => i18n.t(key, options);
export const locale = () => i18n.language === 'en' ? 'en-US' : 'vi-VN';
export const formatDate = value => value ? new Intl.DateTimeFormat(locale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
export const formatNumber = value => new Intl.NumberFormat(locale()).format(value ?? 0);

// Chỉ dùng cho feedback hệ thống/API; tuyệt đối không áp dụng lên tên Deck hay học liệu.
const feedback = new Map();
for (const namespaces of Object.values(resources)) {
  for (const [namespace, messages] of Object.entries(namespaces)) {
    for (const [key, message] of Object.entries(messages)) feedback.set(message, `${namespace}:${key}`);
  }
}
export function localizeMessage(message) {
  const key = feedback.get(message);
  return key ? t(key) : message;
}
export function apiError(code) {
  return t(`validation:${code}`, { defaultValue: t('validation:REQUEST_FAILED') });
}
export default i18n;
