// ============================================================
// MODEL LAYER — Authentication & Authorization Helper
// Only the creator email is allowed to access the CMS.
// ============================================================

export const CREATOR_EMAIL = "buiquangviet032@gmail.com";

/** Returns true if the given user is a creator / admin. */
export const isCreatorUser = (user) => {
  // Dev bypass (stored in localStorage)
  if (localStorage.getItem('studye_creator_bypass') === 'true') {
    return true;
  }

  if (!user || !user.email) return false;

  const email = (user.email || '').toLowerCase().trim();

  if (email === CREATOR_EMAIL.toLowerCase()) return true;
  if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') return true;

  return false;
};

/** Enable or disable the dev bypass flag. */
export const setCreatorBypass = (enabled) => {
  if (enabled) {
    localStorage.setItem('studye_creator_bypass', 'true');
  } else {
    localStorage.removeItem('studye_creator_bypass');
  }
};
