import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '@/examples/components/Spinner';

describe('Spinner Component', () => {
  it('renders spinner with default props', () => {
    render(<Spinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom text', () => {
    render(<Spinner text="Loading data..." />);
    
    // Use getAllByText since text appears twice (visible + screen reader)
    const texts = screen.getAllByText('Loading data...');
    expect(texts.length).toBeGreaterThan(0);
    expect(texts[0]).toBeInTheDocument();
  });

  it('applies correct size classes for small size', () => {
    render(<Spinner size="sm" />);
    
    const spinner = screen.getByRole('status');
    const icon = spinner.querySelector('svg');
    expect(icon).toHaveClass('h-4', 'w-4');
  });

  it('applies correct size classes for medium size', () => {
    render(<Spinner size="md" />);
    
    const spinner = screen.getByRole('status');
    const icon = spinner.querySelector('svg');
    expect(icon).toHaveClass('h-8', 'w-8');
  });

  it('applies correct size classes for large size', () => {
    render(<Spinner size="lg" />);
    
    const spinner = screen.getByRole('status');
    const icon = spinner.querySelector('svg');
    expect(icon).toHaveClass('h-12', 'w-12');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has accessible label', () => {
    render(<Spinner />);
    
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('has accessible label with custom text', () => {
    render(<Spinner text="Processing..." />);
    
    expect(screen.getByLabelText('Processing...')).toBeInTheDocument();
  });

  it('renders screen reader text', () => {
    render(<Spinner text="Loading..." />);
    
    const srText = screen.getByText('Loading...', { selector: '.sr-only' });
    expect(srText).toBeInTheDocument();
  });
});
