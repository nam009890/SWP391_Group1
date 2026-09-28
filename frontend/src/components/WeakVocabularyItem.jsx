const reasons = {
  MANUAL_MARK: 'Bạn đã đánh dấu từ này là chưa thuộc.',
  CONSECUTIVE_WRONG: 'Bạn đã trả lời sai từ này nhiều lần liên tiếp.',
  LOW_ACCURACY: 'Tỷ lệ trả lời đúng của từ này còn thấp.',
  WEAK_STATUS: 'Từ này đang ở trạng thái cần ôn luyện.',
}

export default function WeakVocabularyItem({ item }) {
  const details = [item.pronunciation, item.partOfSpeech].filter(Boolean)
  const mastery = item.masteryScore ?? 0
  const accuracy = item.accuracy ?? 0

  return (
    <article className="card">
      <h2>{item.word} {item.cefrLevel && <small>{item.cefrLevel}</small>}</h2>
      {details.length > 0 && <p>{details.join(' · ')}</p>}
      {item.meaningVi && <p>{item.meaningVi}</p>}
      {item.example && <p><em>{item.example}</em></p>}
      <p>Mastery: {mastery}% · Accuracy: {accuracy}%</p>
      <p>Sai liên tiếp: {item.consecutiveWrong ?? 0} · Đúng: {item.correctCount ?? 0} · Sai: {item.wrongCount ?? 0}</p>
      <p>Lý do cần ôn: {reasons[item.weakReason] || reasons.WEAK_STATUS}</p>
    </article>
  )
}
