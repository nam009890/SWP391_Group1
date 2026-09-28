const reasons = {
  MANUAL_MARK: 'Bạn đã đánh dấu từ này là chưa thuộc.',
  CONSECUTIVE_WRONG: 'Bạn đã trả lời sai từ này nhiều lần liên tiếp.',
  LOW_ACCURACY: 'Tỷ lệ trả lời đúng của từ này còn thấp.',
  WEAK_STATUS: 'Từ này đang ở trạng thái cần ôn luyện.',
}

export default function WeakVocabularyItem({ item }) {
  return <article className="card">
    <h2>{item.word} <small>{item.cefrLevel}</small></h2>
    <p>{item.pronunciation} · {item.partOfSpeech}</p>
    <p>{item.meaningVi || 'Chưa có nghĩa tiếng Việt.'}</p>
    {item.example && <p><em>{item.example}</em></p>}
    <p>Mastery: {item.masteryScore}% · Accuracy: {item.accuracy}%</p>
    <p>Sai liên tiếp: {item.consecutiveWrong} · Đúng: {item.correctCount} · Sai: {item.wrongCount}</p>
    <p>Lý do cần ôn: {reasons[item.weakReason]}</p>
  </article>
}
