import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DeckDetails from './DeckDetails';
import StudyMode from './StudyMode';
import api from '../api/axiosConfig';
import { getDeck, getDeckCards } from '../api/deckApi';
import { getWeakVocabularies } from '../api/weakVocabularyApi';

vi.mock('../api/deckApi', () => ({ getDeck: vi.fn(), getDeckCards: vi.fn(), setDeckVisibility: vi.fn() }));
vi.mock('../api/weakVocabularyApi', () => ({ getWeakVocabularies: vi.fn(), addWeakVocabulary: vi.fn() }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.restoreAllMocks(); });

test('refreshing the same user profile does not reload deck/cards/weak requests', async () => {
  getDeck.mockResolvedValue({ data: { id: 1, name: 'Performance deck', visibility: 'PRIVATE', isOwner: true } });
  getDeckCards.mockResolvedValue({ data: [] });
  getWeakVocabularies.mockResolvedValue({ data: { items: [] } });
  const view = user => <MemoryRouter initialEntries={['/deck/1']}><Routes><Route path="/deck/:id" element={<DeckDetails user={user} />} /></Routes></MemoryRouter>;
  const { rerender } = render(view({ id: 1, name: 'Before', role: 'ROLE_USER' }));
  await screen.findByRole('heading', { name: 'Performance deck' });
  rerender(view({ id: 1, name: 'Updated profile', role: 'ROLE_USER' }));
  await waitFor(() => expect(getDeck).toHaveBeenCalledTimes(1));
  expect(getDeckCards).toHaveBeenCalledTimes(1);
  expect(getWeakVocabularies).toHaveBeenCalledTimes(1);
  rerender(view({ id: 2, name: 'Another account', role: 'ROLE_USER' }));
  await waitFor(() => expect(getDeck).toHaveBeenCalledTimes(2));
});

test('profile refresh does not restart the study session or repeat the due-card request', async () => {
  const request = vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
  const view = user => <MemoryRouter initialEntries={['/study/1']}><Routes><Route path="/study/:id" element={<StudyMode user={user} />} /></Routes></MemoryRouter>;
  const { rerender } = render(view({ id: 1, name: 'Before' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender(view({ id: 1, name: 'Updated profile' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
  rerender(view({ id: 2, name: 'Another account' }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
});
