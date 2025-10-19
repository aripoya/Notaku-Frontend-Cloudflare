import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorMessage from '@/examples/components/ErrorMessage';
import { ApiClientError } from '@/lib/api-client';

describe('ErrorMessage Component', () => {
  it('renders error message correctly', () => {
    const error = new Error('Test error message');
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(/test error message/i)).toBeInTheDocument();
  });

  it('renders custom title', () => {
    const error = new Error('Error');
    render(<ErrorMessage error={error} title="Custom Error Title" />);

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
  });

  it('calls onRetry when retry button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error = new Error('Error');

    render(<ErrorMessage error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /retry action/i });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render when error is null', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('displays status code for ApiClientError', () => {
    const error = new ApiClientError('API Error', 404);
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(/error 404/i)).toBeInTheDocument();
  });

  it('shows user-friendly message for 401 error', () => {
    const error = new ApiClientError('Unauthorized', 401);
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(/please log in to continue/i)).toBeInTheDocument();
  });

  it('shows user-friendly message for 404 error', () => {
    const error = new ApiClientError('Not found', 404);
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(/requested resource was not found/i)).toBeInTheDocument();
  });

  it('shows user-friendly message for 500 error', () => {
    const error = new ApiClientError('Server error', 500);
    render(<ErrorMessage error={error} />);

    expect(screen.getByText(/server error.*try again later/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const error = new Error('Error');
    const { container } = render(<ErrorMessage error={error} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('displays technical details for ApiClientError with details', async () => {
    const user = userEvent.setup();
    const error = new ApiClientError('Error', 400);
    error.details = { field: 'email', message: 'Invalid email' };

    render(<ErrorMessage error={error} />);

    // Click to expand details
    const detailsToggle = screen.getByText(/technical details/i);
    await user.click(detailsToggle);

    expect(screen.getByText(/"field"/)).toBeInTheDocument();
  });
});
