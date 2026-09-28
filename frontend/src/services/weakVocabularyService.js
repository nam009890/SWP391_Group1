import axiosClient from '../api/axiosClient.js'

function ensureObject(data, message) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(message)
  }
  return data
}

export async function getWeakVocabularies(userId) {
  const { data } = await axiosClient.get('/weak-vocabularies', { params: { userId } })
  if (!Array.isArray(data)) {
    throw new Error('Phản hồi từ server không đúng định dạng: danh sách từ cần ôn phải là mảng JSON.')
  }
  return data
}

export async function startFillBlankPractice(userId, limit = 10) {
  const { data } = await axiosClient.post('/weak-vocabularies/practice-sessions', { limit }, { params: { userId } })
  return ensureObject(data, 'Phản hồi tạo phiên luyện tập không đúng định dạng.')
}

export async function getPracticeSession(userId, sessionId) {
  const { data } = await axiosClient.get(`/weak-vocabularies/practice-sessions/${sessionId}`, { params: { userId } })
  const session = ensureObject(data, 'Phản hồi phiên luyện tập không đúng định dạng.')
  if (!Array.isArray(session.pendingQuestions)) {
    throw new Error('Phản hồi phiên luyện tập không có pendingQuestions dạng mảng.')
  }
  return session
}

export async function submitFillBlankAnswer(userId, sessionId, itemId, answer) {
  const { data } = await axiosClient.post(`/weak-vocabularies/practice-sessions/${sessionId}/items/${itemId}/answer`, { answer }, { params: { userId } })
  return ensureObject(data, 'Phản hồi chấm đáp án không đúng định dạng.')
}

export async function getPracticeSummary(userId, sessionId) {
  const { data } = await axiosClient.get(`/weak-vocabularies/practice-sessions/${sessionId}/summary`, { params: { userId } })
  return ensureObject(data, 'Phản hồi tổng kết không đúng định dạng.')
}
