export default function Toast({ message, type = 'success' }) {
  if (!message) return null
  return <p role="status" className={`toast ${type}`}>{message}</p>
}
