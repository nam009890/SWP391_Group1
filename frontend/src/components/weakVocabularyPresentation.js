import { t } from '../i18n/index.js';
const reasons = () => ({
  STUDY_FORGOT: t('common:ban_da_quen_tu_nay_khi_hoc_flashcard_db4924'),
  STUDY_HARD_REPEAT: t('common:ban_da_nhieu_lan_gap_kho_khan_khi_ghi_nh_15c857'),
  STUDY_LOW_RECALL: t('common:ty_le_ghi_nho_tot_cua_tu_nay_duoi_60_4cb45e'),
  PRACTICE_CONSECUTIVE_WRONG: t('common:ban_tra_loi_sai_tu_nay_it_nhat_2_lan_lie_46a0b6'),
  PRACTICE_LOW_ACCURACY: t('common:o_chinh_xac_khi_on_luyen_duoi_60_e0cf63'),
  MANUAL_MARK: t('common:ban_da_tu_danh_dau_tu_nay_can_on_3b94e2'),
  LEGACY_AUTO: t('common:tu_da_duoc_he_thong_tu_dong_ghi_nhan_tru_31db1d'),
});

export function weakReasonLabel(reason) {
  return reasons()[reason] || t('common:tu_can_on_luyen_them_8e7841');
}

export function weakSourceLabel(word) {
  if (word.manualMarked && word.autoDetected) return t('common:thu_cong_tu_dong_937ffe');
  if (word.manualMarked) return t('common:them_thu_cong_c374c3');
  return t('common:tu_dong_phat_hien_13205c');
}

export function studyDetectionMessage(word, detection) {
  if (detection?.status !== 'AUTO_ADDED') return '';
  const message = weakReasonLabel(detection.reason);
  return word + ': ' + message + t('common:he_thong_da_tu_dong_them_vao_danh_sach_t_4ceb10');
}
