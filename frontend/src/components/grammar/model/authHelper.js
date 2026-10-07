// ============================================================
// MODEL LAYER — Community Test Authorization Helper
// Tất cả người dùng cộng đồng đều có quyền tự do tạo bài tập, 
// đăng lên bảng tin và nhận báo lỗi từ các người học khác.
// ============================================================

/**
 * Cho phép bất kỳ người dùng đã đăng nhập nào cũng có quyền tạo bài tập và đăng lên bảng tin.
 * Loại bỏ hoàn toàn sự phụ thuộc vào Admin.
 */
export const canCreateQuestion = (user) => {
  return true;
};

/** Returns true for community creators (enabled for all logged-in members). */
export const isCreatorUser = (user) => {
  return true;
};

/** Enable or disable the dev bypass flag. */
export const setCreatorBypass = (enabled) => {
  if (enabled) {
    localStorage.setItem('studye_creator_bypass', 'true');
  } else {
    localStorage.removeItem('studye_creator_bypass');
  }
};
