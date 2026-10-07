// ============================================================
// MODEL LAYER — Authentication & Authorization Helper
// Only the creator email is allowed to access the CMS.
// ============================================================

export const CREATOR_EMAIL = "buiquangviet032@gmail.com";

/**
 * Cho phép bất kỳ người dùng đã đăng nhập nào cũng có quyền tạo bài tập và đăng lên bảng tin.
 * Loại bỏ hoàn toàn sự phụ thuộc vào Admin.
 */
export const canCreateQuestion = (user) => {
  if (!user) return false;
  return true;
};

/** Returns true if the given user can access creation tools (now enabled for all logged in users). */
export const isCreatorUser = (user) => {
  // Bất kỳ người dùng đã đăng nhập đều có quyền tạo câu hỏi
  if (user && (user.email || user.username || user.id)) return true;
  // Dev bypass (stored in localStorage)
  if (localStorage.getItem('studye_creator_bypass') === 'true') return true;
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
