import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginExample from '@/examples/LoginExample';

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(),
    register: vi.fn(),
    user: null,
    isAuthenticated: false,
  })),
}));

describe('LoginExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form by default', () => {
      render(<LoginExample />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<LoginExample />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should show password toggle button', () => {
      render(<LoginExample />);

      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to register mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const switchButton = screen.getByText(/don't have an account/i);
      await user.click(switchButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
      });
    });

    it('should switch back to login mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register
      const registerLink = screen.getByText(/don't have an account/i);
      await user.click(registerLink);

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      // Switch back to login
      const loginLink = screen.getByText(/already have an account/i);
      await user.click(loginLink);

      await waitFor(() => {
        expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });
    });

    it('should clear form when switching modes', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      // Switch to register
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toHaveValue('');
        expect(screen.getByLabelText(/password/i)).toHaveValue('');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate empty email', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should validate invalid email format', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate empty password', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.click(passwordInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should validate password length in register mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password uppercase requirement', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should validate password number requirement', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('should validate username in register mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'ab');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate confirm password matches', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123');
      await user.type(confirmInput, 'Password456');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput.type).toBe('password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Form Input', () => {
    it('should update email field', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password field', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'Password123');

      expect(passwordInput.value).toBe('Password123');
    });

    it('should update username field in register mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      // Switch to register mode
      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      await user.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });
  });

  describe('Form Icons', () => {
    it('should display email icon', () => {
      render(<LoginExample />);

      const emailIcon = screen.getByLabelText(/email/i).parentElement?.querySelector('svg');
      expect(emailIcon).toBeInTheDocument();
    });

    it('should display password icon', () => {
      render(<LoginExample />);

      const passwordIcon = screen.getByLabelText(/password/i).parentElement?.querySelector('svg');
      expect(passwordIcon).toBeInTheDocument();
    });

    it('should display username icon in register mode', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      await user.click(screen.getByText(/don't have an account/i));

      await waitFor(() => {
        const usernameIcon = screen.getByLabelText(/username/i).parentElement?.querySelector('svg');
        expect(usernameIcon).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(<LoginExample />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper button labels', () => {
      render(<LoginExample />);

      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle password visibility/i })).toBeInTheDocument();
    });

    it('should show validation errors with proper aria attributes', async () => {
      const user = userEvent.setup();
      render(<LoginExample />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      global.innerHeight = 667;
      
      render(<LoginExample />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      global.innerHeight = 1080;
      
      render(<LoginExample />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });
});
