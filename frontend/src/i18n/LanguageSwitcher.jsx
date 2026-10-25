import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return <div className="language-switcher" role="group" aria-label="Tiếng Việt / English">
    <button type="button" lang="vi" aria-pressed={i18n.language === 'vi'} onClick={() => i18n.changeLanguage('vi')}>VI</button>
    <button type="button" lang="en" aria-pressed={i18n.language === 'en'} onClick={() => i18n.changeLanguage('en')}>EN</button>
  </div>;
}
