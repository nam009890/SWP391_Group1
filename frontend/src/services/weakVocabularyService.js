import axiosClient from '../api/axiosClient.js'

const userParams = (userId) => ({ params: { userId } })

export const getWeakVocabularies = (userId) => axiosClient.get('/weak-vocabularies', userParams(userId))
export const startFillBlankPractice = (userId, limit = 10) => axiosClient.post('/weak-vocabularies/practice-sessions', { limit }, userParams(userId))
export const getPracticeSession = (userId, sessionId) => axiosClient.get(`/weak-vocabularies/practice-sessions/${sessionId}`, userParams(userId))
export const submitFillBlankAnswer = (userId, sessionId, itemId, answer) =>
  axiosClient.post(`/weak-vocabularies/practice-sessions/${sessionId}/items/${itemId}/answer`, { answer }, userParams(userId))
export const getPracticeSummary = (userId, sessionId) => axiosClient.get(`/weak-vocabularies/practice-sessions/${sessionId}/summary`, userParams(userId))
