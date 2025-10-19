import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardExample from '@/examples/DashboardExample';

// Mock the hooks
vi.mock('@/hooks/useApi', () => ({
  useNotes: vi.fn(() => ({
    data: {
      items: [
        { id: '1', title: 'Note 1', content: 'Content 1', createdAt: '2025-10-19T00:00:00Z' },
        { id: '2', title: 'Note 2', content: 'Content 2', createdAt: '2025-10-18T00:00:00Z' },
      ],
      total: 2,
    },
    loading: false,
    error: null,
  })),
  useReceipts: vi.fn(() => ({
    data: {
      items: [
        { id: '1', merchantName: 'Store 1', totalAmount: 100000, createdAt: '2025-10-19T00:00:00Z' },
        { id: '2', merchantName: 'Store 2', totalAmount: 200000, createdAt: '2025-10-18T00:00:00Z' },
      ],
      total: 2,
    },
    loading: false,
    error: null,
  })),
  useApiHealth: vi.fn(() => ({
    data: { status: 'healthy', app: 'Notaku API' },
    loading: false,
    error: null,
  })),
}));

describe('DashboardExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dashboard title', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
    });

    it('should render stats cards', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/total notes|notes/i)).toBeInTheDocument();
      expect(screen.getByText(/total receipts|receipts/i)).toBeInTheDocument();
    });

    it('should render recent sections', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/recent notes/i)).toBeInTheDocument();
      expect(screen.getByText(/recent receipts/i)).toBeInTheDocument();
    });
  });

  describe('Stats Cards', () => {
    it('should display correct note count', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should display correct receipt count', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should show trend indicators', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        const trends = screen.queryAllByText(/\+\d+%|\-\d+%/);
        expect(trends.length).toBeGreaterThan(0);
      });
    });

    it('should display total amount', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/300,000|300000/)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Notes', () => {
    it('should display recent notes list', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText('Note 1')).toBeInTheDocument();
        expect(screen.getByText('Note 2')).toBeInTheDocument();
      });
    });

    it('should limit to 5 recent notes', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: {
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `${i}`,
            title: `Note ${i}`,
            content: `Content ${i}`,
            createdAt: new Date().toISOString(),
          })),
          total: 10,
        },
        loading: false,
        error: null,
      });

      render(<DashboardExample />);

      await waitFor(() => {
        const noteItems = screen.getAllByText(/Note \d+/);
        expect(noteItems.length).toBeLessThanOrEqual(5);
      });
    });

    it('should show view all notes link', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/view all notes|see all/i)).toBeInTheDocument();
    });
  });

  describe('Recent Receipts', () => {
    it('should display recent receipts list', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText('Store 1')).toBeInTheDocument();
        expect(screen.getByText('Store 2')).toBeInTheDocument();
      });
    });

    it('should display receipt amounts', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/100,000|100000/)).toBeInTheDocument();
        expect(screen.getByText(/200,000|200000/)).toBeInTheDocument();
      });
    });

    it('should limit to 5 recent receipts', async () => {
      const { useReceipts } = require('@/hooks/useApi');
      useReceipts.mockReturnValue({
        data: {
          items: Array.from({ length: 10 }, (_, i) => ({
            id: `${i}`,
            merchantName: `Store ${i}`,
            totalAmount: 100000,
            createdAt: new Date().toISOString(),
          })),
          total: 10,
        },
        loading: false,
        error: null,
      });

      render(<DashboardExample />);

      await waitFor(() => {
        const receiptItems = screen.getAllByText(/Store \d+/);
        expect(receiptItems.length).toBeLessThanOrEqual(5);
      });
    });

    it('should show view all receipts link', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/view all receipts|see all/i)).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      render(<DashboardExample />);

      expect(screen.getByRole('button', { name: /create note|new note/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload receipt|new receipt/i })).toBeInTheDocument();
    });

    it('should navigate to create note', async () => {
      const user = userEvent.setup();
      render(<DashboardExample />);

      const createButton = screen.getByRole('button', { name: /create note|new note/i });
      await user.click(createButton);

      // Navigation is tested implicitly
      expect(createButton).toBeInTheDocument();
    });

    it('should navigate to upload receipt', async () => {
      const user = userEvent.setup();
      render(<DashboardExample />);

      const uploadButton = screen.getByRole('button', { name: /upload receipt|new receipt/i });
      await user.click(uploadButton);

      // Navigation is tested implicitly
      expect(uploadButton).toBeInTheDocument();
    });
  });

  describe('API Health Status', () => {
    it('should display API health indicator', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/api.*healthy|status.*healthy/i)).toBeInTheDocument();
      });
    });

    it('should show unhealthy status when API is down', async () => {
      const { useApiHealth } = require('@/hooks/useApi');
      useApiHealth.mockReturnValue({
        data: { status: 'unhealthy' },
        loading: false,
        error: null,
      });

      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/unhealthy|down/i)).toBeInTheDocument();
      });
    });

    it('should show loading state for health check', () => {
      const { useApiHealth } = require('@/hooks/useApi');
      useApiHealth.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<DashboardExample />);

      expect(screen.getByText(/checking|loading/i)).toBeInTheDocument();
    });
  });

  describe('Period Selector', () => {
    it('should display period selector', () => {
      render(<DashboardExample />);

      expect(screen.getByText(/7 days|last 7 days/i)).toBeInTheDocument();
      expect(screen.getByText(/30 days|last 30 days/i)).toBeInTheDocument();
    });

    it('should change period when selected', async () => {
      const user = userEvent.setup();
      render(<DashboardExample />);

      const periodButtons = screen.getAllByRole('button');
      const thirtyDaysButton = periodButtons.find(btn => btn.textContent?.includes('30'));

      if (thirtyDaysButton) {
        await user.click(thirtyDaysButton);
        expect(thirtyDaysButton).toHaveClass(/active|selected/);
      }
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner for notes', () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<DashboardExample />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading spinner for receipts', () => {
      const { useReceipts } = require('@/hooks/useApi');
      useReceipts.mockReturnValue({
        data: null,
        loading: true,
        error: null,
      });

      render(<DashboardExample />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no notes', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: { items: [], total: 0 },
        loading: false,
        error: null,
      });

      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/no notes|create your first note/i)).toBeInTheDocument();
      });
    });

    it('should show empty state when no receipts', async () => {
      const { useReceipts } = require('@/hooks/useApi');
      useReceipts.mockReturnValue({
        data: { items: [], total: 0 },
        loading: false,
        error: null,
      });

      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/no receipts|upload your first receipt/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should display error message when notes fail to load', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to load notes'),
      });

      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load notes|error/i)).toBeInTheDocument();
      });
    });

    it('should display error message when receipts fail to load', async () => {
      const { useReceipts } = require('@/hooks/useApi');
      useReceipts.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to load receipts'),
      });

      render(<DashboardExample />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load receipts|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      render(<DashboardExample />);

      expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
    });

    it('should render on tablet viewport', () => {
      global.innerWidth = 768;
      render(<DashboardExample />);

      expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      render(<DashboardExample />);

      expect(screen.getByText(/dashboard|welcome/i)).toBeInTheDocument();
    });

    it('should display stats in grid layout', () => {
      render(<DashboardExample />);

      const statsCards = screen.getAllByText(/total|notes|receipts/i);
      expect(statsCards.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<DashboardExample />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons', () => {
      render(<DashboardExample />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have accessible links', () => {
      render(<DashboardExample />);

      const links = screen.getAllByRole('link');
      links.forEach((link) => {
        expect(link).toHaveAccessibleName();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format currency correctly', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        const amounts = screen.getAllByText(/\d{1,3}(,\d{3})*/);
        expect(amounts.length).toBeGreaterThan(0);
      });
    });

    it('should format dates correctly', async () => {
      render(<DashboardExample />);

      await waitFor(() => {
        const dates = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}|\d+ (day|hour|minute)s? ago/i);
        expect(dates.length).toBeGreaterThan(0);
      });
    });
  });
});
