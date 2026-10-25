import api from './axiosConfig';

export const submitStudyReview = (flashcardId, quality, requestId) =>
  api.post('/study/flashcards/' + flashcardId + '/review', { quality, requestId });
