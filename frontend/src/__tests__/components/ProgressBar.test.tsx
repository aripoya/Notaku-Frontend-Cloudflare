import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProgressBar from '@/examples/components/ProgressBar';
import type { UploadProgress } from '@/types/api';

describe('ProgressBar Component', () => {
  const mockProgress: UploadProgress = {
    loaded: 500000,
    total: 1000000,
    percentage: 50,
  };

  it('renders progress bar', () => {
    render(<ProgressBar progress={mockProgress} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays correct percentage', () => {
    render(<ProgressBar progress={mockProgress} />);
    
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays file size when showSize is true', () => {
    render(<ProgressBar progress={mockProgress} showSize={true} />);
    
    expect(screen.getByText(/0.48 MB \/ 0.95 MB/)).toBeInTheDocument();
  });

  it('hides file size when showSize is false', () => {
    render(<ProgressBar progress={mockProgress} showSize={false} />);
    
    expect(screen.queryByText(/MB/)).not.toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(<ProgressBar progress={mockProgress} showPercentage={false} />);
    
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('shows complete state when progress is 100%', () => {
    const completeProgress: UploadProgress = {
      loaded: 1000000,
      total: 1000000,
      percentage: 100,
    };
    
    render(<ProgressBar progress={completeProgress} />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays check icon when complete', () => {
    const completeProgress: UploadProgress = {
      loaded: 1000000,
      total: 1000000,
      percentage: 100,
    };
    
    const { container } = render(<ProgressBar progress={completeProgress} />);
    
    const checkIcon = container.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });

  it('applies correct progress bar width', () => {
    const { container } = render(<ProgressBar progress={mockProgress} />);
    
    const progressFill = container.querySelector('.bg-blue-600, .bg-blue-500, .bg-blue-400, .bg-green-600');
    expect(progressFill).toHaveStyle({ width: '50%' });
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar progress={mockProgress} className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has correct ARIA attributes', () => {
    render(<ProgressBar progress={mockProgress} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('handles zero progress', () => {
    const zeroProgress: UploadProgress = {
      loaded: 0,
      total: 1000000,
      percentage: 0,
    };
    
    render(<ProgressBar progress={zeroProgress} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('caps percentage at 100%', () => {
    const overProgress: UploadProgress = {
      loaded: 1200000,
      total: 1000000,
      percentage: 120,
    };
    
    const { container } = render(<ProgressBar progress={overProgress} />);
    
    const progressFill = container.querySelector('.bg-green-600');
    expect(progressFill).toHaveStyle({ width: '100%' });
  });
});
