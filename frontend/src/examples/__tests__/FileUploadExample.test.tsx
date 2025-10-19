import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileUploadExample from '@/examples/FileUploadExample';

// Mock useFileUpload hook
vi.mock('@/hooks/useApi', () => ({
  useFileUpload: vi.fn(() => ({
    uploadFile: vi.fn(),
    uploading: false,
    progress: { loaded: 0, total: 0, percentage: 0 },
    error: null,
  })),
}));

describe('FileUploadExample Component - Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<FileUploadExample />);
      expect(container).toBeInTheDocument();
    });

    it('should render upload interface title', () => {
      render(<FileUploadExample />);
      expect(screen.getByText('File Upload')).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<FileUploadExample />);
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should render bucket selection or upload button', () => {
      render(<FileUploadExample />);
      const bucketSelector = screen.getByText(/select storage bucket/i);
      expect(bucketSelector).toBeInTheDocument();
    });
  });

  describe('Bucket Selection', () => {
    it('should have bucket selection UI', () => {
      render(<FileUploadExample />);
      // Should have bucket selector heading
      const bucketUI = screen.getByText(/select storage bucket/i);
      expect(bucketUI).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper component structure', () => {
      const { container } = render(<FileUploadExample />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
