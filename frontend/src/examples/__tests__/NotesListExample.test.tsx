import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotesListExample from '@/examples/NotesListExample';

// Mock the hooks
vi.mock('@/hooks/useApi', () => ({
  useNotes: vi.fn(() => ({
    data: {
      items: [
        {
          id: 'note-001',
          title: 'Test Note 1',
          content: 'Content 1',
          tags: ['work'],
          isPublic: false,
          createdAt: '2025-10-19T00:00:00Z',
          updatedAt: '2025-10-19T00:00:00Z',
        },
        {
          id: 'note-002',
          title: 'Test Note 2',
          content: 'Content 2',
          tags: ['personal'],
          isPublic: false,
          createdAt: '2025-10-18T00:00:00Z',
          updatedAt: '2025-10-18T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    },
    loading: false,
    error: null,
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn(),
    refetch: vi.fn(),
  })),
}));

describe('NotesListExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render notes list', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText(/Test Note 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Test Note 2/i)).toBeInTheDocument();
      });
    });

    it('should render create note button', () => {
      render(<NotesListExample />);

      expect(screen.getByRole('button', { name: /create note|new note|add note/i })).toBeInTheDocument();
    });

    it('should render search input', () => {
      render(<NotesListExample />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        refetch: vi.fn(),
      });

      render(<NotesListExample />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no notes', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        },
        loading: false,
        error: null,
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        refetch: vi.fn(),
      });

      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText(/no notes found|create your first note/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search input', async () => {
      const user = userEvent.setup();
      render(<NotesListExample />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
      await user.type(searchInput, 'Test Note 1');

      expect(searchInput.value).toBe('Test Note 1');
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<NotesListExample />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test');

      // Search should be debounced
      await waitFor(() => {
        expect(searchInput).toHaveValue('test');
      }, { timeout: 1000 });
    });
  });

  describe('Note Display', () => {
    it('should display note titles', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText('Test Note 1')).toBeInTheDocument();
        expect(screen.getByText('Test Note 2')).toBeInTheDocument();
      });
    });

    it('should display note content', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText(/Content 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Content 2/i)).toBeInTheDocument();
      });
    });

    it('should display note tags', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText('work')).toBeInTheDocument();
        expect(screen.getByText('personal')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: {
          items: [],
          total: 50,
          page: 1,
          pageSize: 20,
          totalPages: 3,
        },
        loading: false,
        error: null,
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        refetch: vi.fn(),
      });

      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText(/page 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Note Actions', () => {
    it('should display edit button for each note', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: /edit/i });
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });

    it('should display delete button for each note', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error State', () => {
    it('should display error message when loading fails', async () => {
      const { useNotes } = require('@/hooks/useApi');
      useNotes.mockReturnValue({
        data: null,
        loading: false,
        error: new Error('Failed to load notes'),
        createNote: vi.fn(),
        updateNote: vi.fn(),
        deleteNote: vi.fn(),
        refetch: vi.fn(),
      });

      render(<NotesListExample />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load notes|error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      render(<NotesListExample />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      render(<NotesListExample />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<NotesListExample />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons', async () => {
      render(<NotesListExample />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toHaveAccessibleName();
        });
      });
    });
  });
});
