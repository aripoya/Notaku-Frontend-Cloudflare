import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    
    // Reset the store state
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.logout();
    });
  });

  describe('Initialization', () => {
    it('should initialize with unauthenticated state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should have all required methods', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.checkAuth).toBe('function');
    });
  });

  describe('Login', () => {
    it('should login user successfully', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).not.toBeNull();
        expect(result.current.user?.email).toBe('test@example.com');
        expect(result.current.token).not.toBeNull();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuth());

      const loginPromise = act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      // Check loading state is true during login
      expect(result.current.isLoading).toBe(true);

      await loginPromise;

      // Check loading state is false after login
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle login errors', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.login('invalid@example.com', 'wrongpass');
        })
      ).rejects.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should persist user data after login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('auth-storage');
        expect(stored).not.toBeNull();
        
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.state.user).toBeDefined();
          expect(parsed.state.user.email).toBe('test@example.com');
        }
      });
    });
  });

  describe('Register', () => {
    it('should register user successfully', async () => {
      const { result } = renderHook(() => useAuth());

      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      await act(async () => {
        await result.current.register(registerData);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).not.toBeNull();
        expect(result.current.user?.email).toBe('newuser@example.com');
        expect(result.current.token).not.toBeNull();
      });
    });

    it('should set loading state during registration', async () => {
      const { result } = renderHook(() => useAuth());

      const registerPromise = act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
        });
      });

      expect(result.current.isLoading).toBe(true);

      await registerPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle registration errors', async () => {
      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.register({
            email: 'invalid',
            password: '123',
          });
        })
      ).rejects.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('should logout user successfully', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('should clear persisted data on logout', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // Logout
      act(() => {
        result.current.logout();
      });

      // Check localStorage is updated
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.user).toBeNull();
        expect(parsed.state.token).toBeNull();
      }
    });

    it('should handle logout when not authenticated', () => {
      const { result } = renderHook(() => useAuth());

      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('should verify authentication with valid token', async () => {
      const { result } = renderHook(() => useAuth());

      // Login first
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      // Check auth
      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should not authenticate without token', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.checkAuth();
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Persistence', () => {
    it('should persist authentication state', async () => {
      const { result: result1 } = renderHook(() => useAuth());

      await act(async () => {
        await result1.current.login('test@example.com', 'password123');
      });

      await waitFor(() => expect(result1.current.isAuthenticated).toBe(true));

      // Create new hook instance (simulating page reload)
      const { result: result2 } = renderHook(() => useAuth());

      // State should be persisted
      expect(result2.current.user).not.toBeNull();
      expect(result2.current.token).not.toBeNull();
    });

    it('should only persist specific fields', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        const stored = localStorage.getItem('auth-storage');
        expect(stored).not.toBeNull();
        
        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed.state).toHaveProperty('user');
          expect(parsed.state).toHaveProperty('token');
          expect(parsed.state).toHaveProperty('isAuthenticated');
          // isLoading should not be persisted
          expect(parsed.state.isLoading).toBeUndefined();
        }
      });
    });
  });

  describe('User Data', () => {
    it('should store complete user information', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      await waitFor(() => {
        expect(result.current.user).toMatchObject({
          id: expect.any(String),
          email: 'test@example.com',
        });
      });
    });

    it('should handle user with tier information', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.register({
          email: 'pro@example.com',
          password: 'password123',
          tier: 'pro',
        });
      });

      await waitFor(() => {
        expect(result.current.user?.tier).toBeDefined();
      });
    });
  });
});
