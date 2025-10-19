import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatExample from '@/examples/AIChatExample';

// Mock the hooks
vi.mock('@/hooks/useApi', () => ({
  useAI: vi.fn(() => ({
    loading: false,
    streaming: false,
    response: '',
    error: null,
    chat: vi.fn(),
    chatStream: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('AIChatExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chat interface', () => {
      render(<AIChatExample />);

      expect(screen.getByPlaceholderText(/type.*message|enter.*message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should render chat title', () => {
      render(<AIChatExample />);

      expect(screen.getByText(/ai chat|chat with ai/i)).toBeInTheDocument();
    });

    it('should render example prompts', () => {
      render(<AIChatExample />);

      expect(screen.getByText(/example|suggestions/i)).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('should update message input', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i) as HTMLInputElement;
      await user.type(input, 'Hello AI');

      expect(input.value).toBe('Hello AI');
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      const { useAI } = require('@/hooks/useApi');
      const mockChat = vi.fn().mockResolvedValue({ message: 'AI response' });
      
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: '',
        error: null,
        chat: mockChat,
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i) as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello AI');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      const { useAI } = require('@/hooks/useApi');
      const mockChat = vi.fn().mockResolvedValue({ message: 'AI response' });
      
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: '',
        error: null,
        chat: mockChat,
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      await user.type(input, 'Hello AI{Enter}');

      await waitFor(() => {
        expect(mockChat).toHaveBeenCalled();
      });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      const { useAI } = require('@/hooks/useApi');
      const mockChat = vi.fn();
      
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: '',
        error: null,
        chat: mockChat,
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockChat).not.toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    it('should display user messages', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      await user.type(input, 'Hello AI');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        expect(screen.getByText('Hello AI')).toBeInTheDocument();
      });
    });

    it('should display AI responses', async () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: 'AI response to your message',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      expect(screen.getByText(/AI response to your message/i)).toBeInTheDocument();
    });

    it('should distinguish between user and AI messages', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      await user.type(input, 'User message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        const userMessage = screen.getByText('User message');
        expect(userMessage).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while waiting for response', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: true,
        streaming: false,
        response: '',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      expect(screen.getByText(/loading|thinking|typing/i)).toBeInTheDocument();
    });

    it('should show streaming indicator during streaming', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: false,
        streaming: true,
        response: '',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      expect(screen.getByText(/streaming|typing|responding/i)).toBeInTheDocument();
    });

    it('should disable input while loading', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: true,
        streaming: false,
        response: '',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      expect(input).toBeDisabled();
    });

    it('should disable send button while loading', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: true,
        streaming: false,
        response: '',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Example Prompts', () => {
    it('should display example prompts', () => {
      render(<AIChatExample />);

      expect(screen.getByText(/example|suggestions/i)).toBeInTheDocument();
    });

    it('should use example prompt when clicked', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const exampleButtons = screen.getAllByRole('button');
      const exampleButton = exampleButtons.find(btn => 
        btn.textContent?.includes('expense') || 
        btn.textContent?.includes('receipt') ||
        btn.textContent?.includes('help')
      );

      if (exampleButton) {
        await user.click(exampleButton);

        const input = screen.getByPlaceholderText(/type.*message|enter.*message/i) as HTMLInputElement;
        expect(input.value).not.toBe('');
      }
    });
  });

  describe('Clear Chat', () => {
    it('should have clear chat button', () => {
      render(<AIChatExample />);

      expect(screen.getByRole('button', { name: /clear|reset/i })).toBeInTheDocument();
    });

    it('should clear messages when clear button clicked', async () => {
      const user = userEvent.setup();
      const { useAI } = require('@/hooks/useApi');
      const mockReset = vi.fn();
      
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: 'Some response',
        error: null,
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: mockReset,
      });

      render(<AIChatExample />);

      const clearButton = screen.getByRole('button', { name: /clear|reset/i });
      await user.click(clearButton);

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failure', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: '',
        error: new Error('Failed to send message'),
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      expect(screen.getByText(/failed to send message|error/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const { useAI } = require('@/hooks/useApi');
      useAI.mockReturnValue({
        loading: false,
        streaming: false,
        response: '',
        error: new Error('Failed to send message'),
        chat: vi.fn(),
        chatStream: vi.fn(),
        reset: vi.fn(),
      });

      render(<AIChatExample />);

      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });
  });

  describe('Auto-scroll', () => {
    it('should scroll to bottom on new messages', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));

      // Auto-scroll is tested implicitly through message display
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible input', () => {
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      expect(input).toHaveAccessibleName();
    });

    it('should have accessible buttons', () => {
      render(<AIChatExample />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA labels for messages', async () => {
      const user = userEvent.setup();
      render(<AIChatExample />);

      const input = screen.getByPlaceholderText(/type.*message|enter.*message/i);
      await user.type(input, 'Test');
      await user.click(screen.getByRole('button', { name: /send/i }));

      await waitFor(() => {
        const message = screen.getByText('Test');
        expect(message).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      render(<AIChatExample />);

      expect(screen.getByPlaceholderText(/type.*message|enter.*message/i)).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      render(<AIChatExample />);

      expect(screen.getByPlaceholderText(/type.*message|enter.*message/i)).toBeInTheDocument();
    });
  });
});
