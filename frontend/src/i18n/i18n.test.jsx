import { afterEach, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import i18n, { t, apiError } from './index';
import LanguageSwitcher from './LanguageSwitcher';
import Navbar from '../components/Navbar';
import CreateDeckModal from '../components/CreateDeckModal';
import ProtectedRoute from '../components/ProtectedRoute';
import { weakReasonLabel } from '../components/weakVocabularyPresentation';

afterEach(async () => { cleanup(); await i18n.changeLanguage('vi'); localStorage.removeItem('token'); });
test('language preference persists independently of credentials', async () => {
  localStorage.setItem('token', 'unchanged-test-token');
  render(<LanguageSwitcher />);
  fireEvent.click(screen.getByRole('button', { name: 'EN' }));
  await waitFor(() => expect(localStorage.getItem('studye.language')).toBe('en'));
  expect(localStorage.getItem('token')).toBe('unchanged-test-token');
  expect(document.documentElement.lang).toBe('en');
  expect(apiError('ACCOUNT_LOCKED')).toMatch(/locked/);
  expect(t('missing:key', { defaultValue: 'safe fallback' })).toBe('safe fallback');
});
test('translated navbar closes profile menu on Escape and outside click', async () => {
  await i18n.changeLanguage('en');
  render(<MemoryRouter><Navbar user={{ name: 'QA learner', role: 'ROLE_USER' }} onLogout={vi.fn()} /></MemoryRouter>);
  expect(screen.getByText('My Decks')).toBeTruthy();
  const details = document.querySelector('details'); details.open = true;
  fireEvent.keyDown(document, { key: 'Escape' }); expect(details.open).toBe(false);
  details.open = true; fireEvent.pointerDown(document.body); expect(details.open).toBe(false);
});
test('language change does not reset unsaved deck fields and Escape closes modal', async () => {
  const close = vi.fn();
  const { rerender } = render(<CreateDeckModal isOpen onClose={close} />);
  fireEvent.change(document.querySelector('#deckName'), { target: { value: 'My learner content' } });
  await i18n.changeLanguage('en');
  rerender(<CreateDeckModal isOpen onClose={close} />);
  expect(document.querySelector('#deckName').value).toBe('My learner content');
  expect(screen.getByRole('dialog')).toBeTruthy();
  fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalledTimes(1);
});
test('protected learner content renders only for an authenticated user', () => {
  const tree = user => <MemoryRouter initialEntries={['/private']}><Routes>
    <Route path="/private" element={<ProtectedRoute user={user}>Private learning</ProtectedRoute>} />
    <Route path="/login" element={<h1>Sign in page</h1>} />
  </Routes></MemoryRouter>;
  const { rerender } = render(tree({ id: 1 }));
  expect(screen.getByText('Private learning')).toBeTruthy();
  rerender(tree(null));
  expect(screen.queryByText('Private learning')).toBeNull();
});
test('feature label factories retranslate without changing learner data', async () => {
  await i18n.changeLanguage('vi');
  expect(weakReasonLabel('MANUAL_MARK')).toMatch(/đánh dấu/);
  await i18n.changeLanguage('en');
  expect(weakReasonLabel('MANUAL_MARK')).toMatch(/manually/);
});
