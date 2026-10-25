import { test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MainApp from './App';
import api from './api/axiosConfig';
import i18n from './i18n';

vi.mock('./api/axiosConfig', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('./components/Dashboard', () => ({ default: ({ user }) => <h1>{user ? `Authenticated ${user.name}` : 'Guest dashboard'}</h1> }));
afterEach(() => { cleanup(); localStorage.removeItem('token'); sessionStorage.clear(); vi.clearAllMocks(); });
function token(exp = Math.floor(Date.now() / 1000) + 3600) { return `header.${btoa(JSON.stringify({ exp }))}.signature`; }
test('auth initialization waits for server profile and logout captures Authorization before clearing storage', async () => {
  await i18n.changeLanguage('en');
  const saved = token(); localStorage.setItem('token', saved);
  let complete;
  api.get.mockReturnValue(new Promise(resolve => { complete = resolve; }));
  api.post.mockResolvedValue({});
  render(<MemoryRouter initialEntries={['/my-decks']}><MainApp /></MemoryRouter>);
  expect(screen.getByText('Verifying your session…')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Login', exact: true })).toBeNull();
  await act(async () => complete({ data: { id: 1, name: 'QA learner', role: 'ROLE_USER' } }));
  await screen.findByRole('heading', { name: 'Authenticated QA learner' });
  expect(api.get).toHaveBeenCalledTimes(1);
  fireEvent.click(document.querySelector('.nav-profile-menu summary'));
  fireEvent.click(screen.getByRole('button', { name: 'Sign out', exact: true }));
  expect(localStorage.getItem('token')).toBeNull();
  expect(api.post.mock.calls[0][0]).toBe('/auth/logout');
  expect(api.post.mock.calls[0][2].headers.Authorization).toBe(`Bearer ${saved}`);
  await waitFor(() => expect(screen.queryByRole('heading', { name: 'Authenticated QA learner' })).toBeNull());
});
test('an expired token does not request repeated profile or login calls', async () => {
  await i18n.changeLanguage('en'); localStorage.setItem('token', token(1));
  render(<MemoryRouter initialEntries={['/my-decks']}><MainApp /></MemoryRouter>);
  await screen.findByRole('heading', { name: 'Sign in', exact: true });
  expect(localStorage.getItem('token')).toBeNull(); expect(api.get).not.toHaveBeenCalled();
});
