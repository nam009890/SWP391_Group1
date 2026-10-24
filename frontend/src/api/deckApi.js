import api from './axiosConfig';

export const listDecks = (mine, params, signal) => api.get(`/decks/${mine ? 'my' : 'public'}`, { params, signal });
export const getDeck = (id, authenticated, signal) => api.get(`/decks/${authenticated ? '' : 'public/'}${id}`, { signal });
export const getDeckCards = (id, authenticated, signal) => api.get(`/decks/${authenticated ? '' : 'public/'}${id}/flashcards`, { signal });
export const saveDeck = (deck, id) => id ? api.put(`/decks/${id}`, deck) : api.post('/decks', deck);
export const setDeckVisibility = (id, visibility) => api.patch(`/decks/${id}/visibility`, { visibility });
export const deleteDeck = (id) => api.delete(`/decks/${id}`);
