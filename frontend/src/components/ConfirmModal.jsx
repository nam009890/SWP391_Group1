export default function ConfirmModal({ open, title, message, loading, onConfirm, onCancel }) {
  if (!open) return null
  return <div className="modal-overlay" role="presentation"><section className="card" role="dialog"><h2>{title}</h2><p>{message}</p><button type="button" onClick={onCancel} disabled={loading}>Hủy</button><button type="button" onClick={onConfirm} disabled={loading}>{loading ? 'Đang xóa...' : 'Xóa'}</button></section></div>
}
