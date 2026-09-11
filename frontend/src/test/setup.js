import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Shared AuthContext mock — provides a non-PATIENT admin user
// so components that gate features behind role checks render fully.
// AuthProvider is passed through from the real module via importActual.
// Individual test files can override with their own vi.mock if needed
// (e.g., Login.test.jsx, AuthContext.test.jsx).
vi.mock('../contexts/AuthContext', async () => {
  const actual = await vi.importActual('../contexts/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { name: 'Test Admin', role: 'ADMIN' },
      loading: false,
    }),
  };
});
