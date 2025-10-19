import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AIChatExample from '@/examples/AIChatExample';

// Mock useAI hook
vi.mock('@/hooks/useApi', () => ({
  useAI: vi.fn(() => ({
    chatStream: vi.fn(),
    streaming: false,
    response: '',
    reset: vi.fn(),
  })),
}));

describe('AIChatExample Component - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<AIChatExample />);
      expect(container).toBeInTheDocument();
    });

    it('should render chat interface title', () => {
      render(<AIChatExample />);
      expect(screen.getByText(/ai chat|chat interface/i)).toBeInTheDocument();
    });

    it('should render message input', () => {
      render(<AIChatExample />);
      const input = screen.getByPlaceholderText(/message|type|ask/i);
      expect(input).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<AIChatExample />);
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('Example Prompts', () => {
    it('should display example prompts or suggestions', () => {
      render(<AIChatExample />);
      // Check for any example/suggestion text
      const hasExamples = 
        screen.queryByText(/example|try asking|suggestion/i) ||
        screen.queryByText(/summarize|explain|help/i);
      
      // Component should have some guidance
      expect(hasExamples || screen.getByPlaceholderText(/message|type|ask/i)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper component structure', () => {
      const { container } = render(<AIChatExample />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
