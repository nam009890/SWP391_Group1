import axiosClient from '../api/axiosClient.js'

function ensureObject(data, message) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(message)
  }
  return data
}

export async function getWeakVocabularies(userId, filters = {}, page = 0, size = 10) {
  const { data } = await axiosClient.get('/weak-vocabularies', { params: { userId, page, size, ...filters } })
  if (!data || !Array.isArray(data.items)) {
    throw new Error('Phản hồi từ server không đúng định dạng: items phải là mảng JSON.')
  }
  return data
}

export async function startFillBlankPractice(userId, questionType, userVocabularyIds) {
  const { data } = await axiosClient.post('/weak-vocabularies/practice-sessions', { questionType, userVocabularyIds }, { params: { userId } })
  return ensureObject(data, 'Phản hồi tạo phiên luyện tập không đúng định dạng.')
}

export async function updateWeakVocabulary(userId, id, payload) {
  const { data } = await axiosClient.patch(`/weak-vocabularies/${id}`, payload, { params: { userId } })
  return ensureObject(data, 'Phản hồi cập nhật không đúng định dạng.')
}

export async function deleteWeakVocabulary(userId, id) {
  await axiosClient.delete(`/weak-vocabularies/${id}`, { params: { userId } })
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
