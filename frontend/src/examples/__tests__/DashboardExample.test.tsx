import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardExample from '@/examples/DashboardExample';

// Mock all hooks
vi.mock('@/hooks/useApi', () => ({
  useNotes: vi.fn(() => ({
    data: { items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 },
    loading: false,
    error: null,
  })),
  useReceipts: vi.fn(() => ({
    data: { items: [], total: 0, page: 1, pageSize: 5, totalPages: 0 },
    loading: false,
    error: null,
  })),
  useApiHealth: vi.fn(() => ({
    healthy: true,
    checking: false,
  })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
  })),
}));

describe('DashboardExample Component - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<DashboardExample />);
      expect(container).toBeInTheDocument();
    });

    it('should render dashboard title or heading', () => {
      render(<DashboardExample />);
      const heading = screen.getByText(/welcome back/i);
      expect(heading).toBeInTheDocument();
    });

    it('should render stats cards', () => {
      render(<DashboardExample />);
      // Check for common stat labels
      const hasStats = 
        screen.queryByText(/total notes/i) ||
        screen.queryByText(/receipts/i) ||
        screen.queryByText(/spending/i) ||
        screen.queryByText(/storage/i);
      expect(hasStats).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should have interactive elements', () => {
      render(<DashboardExample />);
      // Dashboard should have some interactive elements
      const { container } = render(<DashboardExample />);
      expect(container.querySelectorAll('button, a, input').length).toBeGreaterThan(0);
    });
  });

  describe('Component Structure', () => {
    it('should have proper component structure', () => {
      const { container } = render(<DashboardExample />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
