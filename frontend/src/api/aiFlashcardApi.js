import api from './axiosConfig';

export const getAiOptions = (deckId, signal) => api.get('/decks/' + deckId + '/ai/options', { signal });
export const generateAiPreview = (deckId, body, signal) => api.post('/decks/' + deckId + '/ai/preview', body, { signal });
export const generateOfflinePreview = (deckId, body, signal) => api.post('/decks/' + deckId + '/ai/preview/offline', body, { signal });
export const commitAiPreview = (deckId, body) => api.post('/decks/' + deckId + '/ai/commit', body);
