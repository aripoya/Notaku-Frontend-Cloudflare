import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock mockApi with simple behavior
vi.mock('@/lib/mockApi', () => ({
  mockApi: {
    login: vi.fn((email: string, password: string) => {
      // Simulate mockApi behavior: only specific credentials work
      if (email === 'demo@example.com' && password === 'password123') {
        return Promise.resolve({
          success: true,
          user: { id: '1', email, name: 'Demo User', businessName: 'Demo Business' },
          token: 'mock-token-123',
        });
      }
      return Promise.reject(new Error('Email atau password salah'));
    }),
    register: vi.fn((data: any) => {
      return Promise.resolve({
        success: true,
        user: { id: '1', email: data.email, name: data.name || 'Pengguna Baru' },
        token: 'mock-token-456',
      });
    }),
  },
}));

describe('useAuth Hook - Simplified', () => {
  beforeEach(() => {
    // Clear store state
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.logout();
    });
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide all required methods', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.checkAuth).toBe('function');
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('demo@example.com', 'password123');
      });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('demo@example.com');
      expect(result.current.token).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login errors with invalid credentials', async () => {
      const { result } = renderHook(() => useAuth());

      try {
        await act(async () => {
          await result.current.login('wrong@example.com', 'wrong');
        });
      } catch (error) {
        // Expected to throw
      }

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Register', () => {
    it('should successfully register new user', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123',
        });
      });

      expect(result.current.user).toBeDefined();
      expect(result.current.user?.email).toBe('newuser@example.com');
      expect(result.current.token).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should use default name if not provided', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user?.name).toBeDefined();
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Logout', () => {
    it('should clear user data on logout', async () => {
      const { result } = renderHook(() => useAuth());

      // First login
      await act(async () => {
        await result.current.login('demo@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be safe to call logout when not authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Check Auth', () => {
    it('should restore authenticated state when token exists', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login('demo@example.com', 'password123');
      });

      // Manually set isAuthenticated to false
      act(() => {
        useAuth.setState({ isAuthenticated: false });
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Check auth should restore
      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not authenticate when no token', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('User Flow', () => {
    it('should handle complete login -> logout flow', async () => {
      const { result } = renderHook(() => useAuth());

      // Login
      await act(async () => {
        await result.current.login('demo@example.com', 'password123');
      });
      expect(result.current.isAuthenticated).toBe(true);

      // Logout
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should handle register -> logout flow', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          name: 'New User',
          password: 'password123',
        });
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should maintain state across multiple operations', async () => {
      const { result } = renderHook(() => useAuth());

      // Register
      await act(async () => {
        await result.current.register({
          email: 'user1@example.com',
          name: 'User 1',
          password: 'password123',
        });
      });
      const firstToken = result.current.token;

      // Logout
      act(() => {
        result.current.logout();
      });
      expect(result.current.token).toBeNull();

      // Login
      await act(async () => {
        await result.current.login('demo@example.com', 'password123');
      });
      expect(result.current.token).toBeDefined();
      expect(result.current.token).not.toBe(firstToken);
    });
  });
});
