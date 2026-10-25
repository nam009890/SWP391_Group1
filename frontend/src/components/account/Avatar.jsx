import { t } from '../../i18n/index.js';
export default function Avatar({ user, className = '' }) {
  const url = /^https?:\/\//i.test(user?.avatarUrl || '') ? user.avatarUrl : null;
  return <span className={'account-avatar ' + className} key={url || 'initials'}>
    <span>{(user?.name || user?.email || 'U').charAt(0).toUpperCase()}</span>
    {url && <img src={url} alt={t('profile:anh_dai_dien_d0cffc') + (user?.name || '')} referrerPolicy="no-referrer" onError={e => { e.currentTarget.hidden = true; }} />}
  </span>;
}
