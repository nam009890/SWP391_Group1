import api from './axiosConfig';
export const getWeakVocabularies = (params) => api.get('/weak-vocabularies', { params });
export const addWeakVocabulary = (flashcardId) => api.post(`/weak-vocabularies/flashcards/${flashcardId}`);
export const updateWeakVocabulary = (id, data) => api.patch(`/weak-vocabularies/${id}`, data);
export const deleteWeakVocabulary = (id) => api.delete(`/weak-vocabularies/${id}`);
export const createWeakPracticeSession = (data) => api.post('/weak-vocabularies/practice-sessions', data);
export const getWeakPracticeSession = (id) => api.get(`/weak-vocabularies/practice-sessions/${id}`);
export const submitWeakPracticeAnswer = (sid, iid, answer) => api.post(`/weak-vocabularies/practice-sessions/${sid}/items/${iid}/answer`, { answer });
export const getWeakPracticeSummary = (id) => api.get(`/weak-vocabularies/practice-sessions/${id}/summary`);
