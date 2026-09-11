import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import * as api from '../../services/api';

// Override the global AuthContext mock from setup.js — this test suite
// needs the real AuthProvider and useAuth to verify context behavior.
const { AuthProvider, useAuth } = await vi.importActual('../../contexts/AuthContext');

// Mock localStorage for environments where it might not be available
function createLocalStorageMock() {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
}

function TestConsumer({ onRender }) {
  const auth = useAuth();
  if (onRender) onRender(auth);
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.name : 'no user'}</div>
      <div data-testid="loading">{auth.loading ? 'loading' : 'not loading'}</div>
      <div data-testid="error">{auth.error || 'no error'}</div>
    </div>
  );
}

function renderWithProvider(children) {
  return render(<AuthProvider>{children}</AuthProvider>);
}

describe('AuthContext', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    Object.defineProperty(global, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original localStorage (if any)
    delete global.localStorage;
  });

  it('shows no user when not authenticated', () => {
    renderWithProvider(<TestConsumer />);
    expect(screen.getByTestId('user')).toHaveTextContent('no user');
  });

  it('restores user from stored token', async () => {
    const mockUser = { id: '1', name: 'Admin', role: 'ADMIN', token: 'test-token' };
    localStorage.setItem('authToken', 'test-token');
    vi.spyOn(api, 'getMe').mockResolvedValue(mockUser);

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Admin');
    });
  });

  it('clears token if getMe fails', async () => {
    localStorage.setItem('authToken', 'bad-token');
    vi.spyOn(api, 'getMe').mockRejectedValue(new Error('Unauthorized'));

    renderWithProvider(<TestConsumer />);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });

  it('handles login successfully', async () => {
    const mockResult = {
      success: true,
      user: { id: '1', name: 'Admin', role: 'ADMIN', token: 'new-token' },
    };
    vi.spyOn(api, 'login').mockResolvedValue(mockResult);

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    let result;
    await act(async () => {
      result = await auth.login('admin', 'admin123');
    });

    expect(result.success).toBe(true);
    expect(localStorage.getItem('authToken')).toBe('new-token');
  });

  it('handles login failure', async () => {
    vi.spyOn(api, 'login').mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    let result;
    await act(async () => {
      result = await auth.login('admin', 'wrong');
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials');
  });

  it('handles login network error', async () => {
    vi.spyOn(api, 'login').mockRejectedValue(new Error('Network error'));

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    let result;
    await act(async () => {
      result = await auth.login('admin', 'admin123');
    });

    expect(result.success).toBe(false);
  });

  it('handles logout', async () => {
    const mockUser = { id: '1', name: 'Admin', role: 'ADMIN', token: 'tok' };
    localStorage.setItem('authToken', 'tok');
    vi.spyOn(api, 'logout').mockResolvedValue({});
    vi.spyOn(api, 'getMe').mockResolvedValue(mockUser);

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Admin'));

    await act(async () => {
      await auth.logout();
    });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(screen.getByTestId('user')).toHaveTextContent('no user');
  });

  it('provides role checking helpers', async () => {
    const mockUser = { id: '1', name: 'Admin', role: 'ADMIN', token: 't' };
    localStorage.setItem('authToken', 't');
    vi.spyOn(api, 'getMe').mockResolvedValue(mockUser);

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    await waitFor(() => {
      expect(auth.isAdmin()).toBe(true);
      expect(auth.isDoctor()).toBe(false);
      expect(auth.isReceptionist()).toBe(false);
      expect(auth.isNurse()).toBe(false);
      expect(auth.isLoggedIn()).toBe(true);
      expect(auth.hasRole('ADMIN')).toBe(true);
      expect(auth.hasRole('DOCTOR')).toBe(false);
    });
  });

  it('admin user can access any role', async () => {
    const mockUser = { id: '1', name: 'Admin', role: 'ADMIN', token: 't' };
    localStorage.setItem('authToken', 't');
    vi.spyOn(api, 'getMe').mockResolvedValue(mockUser);

    let auth;
    renderWithProvider(<TestConsumer onRender={(a) => { auth = a; }} />);

    await waitFor(() => {
      expect(auth.canAccess(['DOCTOR', 'NURSE'])).toBe(true);
    });
  });

  it('throws error if useAuth is used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within AuthProvider');

    spy.mockRestore();
  });
});
