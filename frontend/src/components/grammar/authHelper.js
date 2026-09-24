// Authentication and Authorization helper for Grammar Creator / Admin
export const CREATOR_EMAIL = "buiquangviet032@gmail.com";

export const isCreatorUser = (user) => {
  // If no user object or no email, check if localStorage has temporary dev bypass
  if (!user || !user.email) {
    return localStorage.getItem('studye_creator_bypass') === 'true';
  }

  const email = (user.email || '').toLowerCase().trim();
  
  // Primary creator check: user's email
  if (email === CREATOR_EMAIL.toLowerCase()) {
    return true;
  }

  // System admin role check
  if (user.role === 'ROLE_ADMIN' || user.role === 'ADMIN') {
    return true;
  }

  // Manual bypass toggle for development/testing
  if (localStorage.getItem('studye_creator_bypass') === 'true') {
    return true;
  }

  return false;
};

export const setCreatorBypass = (enabled) => {
  if (enabled) {
    localStorage.setItem('studye_creator_bypass', 'true');
  } else {
    localStorage.removeItem('studye_creator_bypass');
  }
};
