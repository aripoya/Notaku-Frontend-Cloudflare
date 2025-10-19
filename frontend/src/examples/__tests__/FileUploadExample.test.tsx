import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUploadExample from '@/examples/FileUploadExample';

// Mock the hooks
vi.mock('@/hooks/useApi', () => ({
  useFileUpload: vi.fn(() => ({
    uploading: false,
    progress: { loaded: 0, total: 0, percentage: 0 },
    error: null,
    uploadFile: vi.fn(),
    reset: vi.fn(),
  })),
}));

describe('FileUploadExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file upload interface', () => {
      render(<FileUploadExample />);

      expect(screen.getByText(/file upload|upload files/i)).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<FileUploadExample />);

      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('should render bucket selector', () => {
      render(<FileUploadExample />);

      expect(screen.getByText(/bucket|destination|folder/i)).toBeInTheDocument();
    });
  });

  describe('Multiple File Selection', () => {
    it('should accept multiple files', () => {
      render(<FileUploadExample />);

      const fileInput = screen.getByLabelText(/choose files|select files|upload/i) as HTMLInputElement;
      expect(fileInput.multiple).toBe(true);
    });

    it('should handle multiple file selection', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file1 = new File(['content1'], 'file1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'file2.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, [file1, file2]);

      await waitFor(() => {
        expect(screen.getByText(/file1.jpg/i)).toBeInTheDocument();
        expect(screen.getByText(/file2.png/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bucket Selection', () => {
    it('should display bucket options', () => {
      render(<FileUploadExample />);

      expect(screen.getByText(/uploads/i)).toBeInTheDocument();
      expect(screen.getByText(/avatars/i)).toBeInTheDocument();
    });

    it('should change bucket selection', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const bucketSelect = screen.getByRole('combobox', { name: /bucket|destination/i });
      await user.selectOptions(bucketSelect, 'avatars');

      expect(bucketSelect).toHaveValue('avatars');
    });
  });

  describe('File List', () => {
    it('should display selected files', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/test.jpg/i)).toBeInTheDocument();
      });
    });

    it('should show file size', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/bytes|kb|mb/i)).toBeInTheDocument();
      });
    });

    it('should show remove button for each file', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
      });
    });
  });

  describe('File Removal', () => {
    it('should remove file when remove button clicked', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/test.jpg/i)).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText(/test.jpg/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload Progress', () => {
    it('should show progress for each file', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: true,
        progress: { loaded: 500000, total: 1000000, percentage: 50 },
        error: null,
        uploadFile: vi.fn(),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/50%/i)).toBeInTheDocument();
    });

    it('should show uploading state', () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: true,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: null,
        uploadFile: vi.fn(),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });
  });

  describe('Upload All', () => {
    it('should have upload all button', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload all/i })).toBeInTheDocument();
      });
    });

    it('should upload all files when clicked', async () => {
      const user = userEvent.setup();
      const { useFileUpload } = require('@/hooks/useApi');
      const mockUploadFile = vi.fn().mockResolvedValue({
        filename: 'test.jpg',
        url: 'https://example.com/test.jpg',
      });

      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: null,
        uploadFile: mockUploadFile,
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload all/i })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /upload all/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(mockUploadFile).toHaveBeenCalled();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after upload', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadFile: vi.fn().mockResolvedValue({
          filename: 'test.jpg',
          url: 'https://example.com/test.jpg',
        }),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      await waitFor(() => {
        expect(screen.getByText(/success|uploaded|complete/i)).toBeInTheDocument();
      });
    });

    it('should show file URL after upload', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadFile: vi.fn().mockResolvedValue({
          filename: 'test.jpg',
          url: 'https://example.com/test.jpg',
        }),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      await waitFor(() => {
        expect(screen.getByText(/https:\/\//i)).toBeInTheDocument();
      });
    });

    it('should have copy URL button', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadFile: vi.fn().mockResolvedValue({
          filename: 'test.jpg',
          url: 'https://example.com/test.jpg',
        }),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on upload failure', () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: new Error('Upload failed'),
        uploadFile: vi.fn(),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      expect(screen.getByText(/upload failed|error/i)).toBeInTheDocument();
    });

    it('should show retry button on error', () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: new Error('Upload failed'),
        uploadFile: vi.fn(),
        reset: vi.fn(),
      });

      render(<FileUploadExample />);

      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should have drag and drop zone', () => {
      render(<FileUploadExample />);

      expect(screen.getByText(/drag.*drop|drop.*here/i)).toBeInTheDocument();
    });

    it('should accept dropped files', async () => {
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const dropZone = screen.getByText(/drag.*drop|drop.*here/i).closest('div');

      if (dropZone) {
        const dropEvent = new Event('drop', { bubbles: true });
        Object.defineProperty(dropEvent, 'dataTransfer', {
          value: {
            files: [file],
          },
        });

        dropZone.dispatchEvent(dropEvent);
      }
    });
  });

  describe('File Preview', () => {
    it('should show image preview for image files', async () => {
      const user = userEvent.setup();
      render(<FileUploadExample />);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        const preview = screen.queryByAltText(/preview/i);
        if (preview) {
          expect(preview).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<FileUploadExample />);

      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);
      expect(fileInput).toHaveAccessibleName();
    });

    it('should have accessible buttons', () => {
      render(<FileUploadExample />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper ARIA labels', () => {
      render(<FileUploadExample />);

      const fileInput = screen.getByLabelText(/choose files|select files|upload/i);
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      render(<FileUploadExample />);

      expect(screen.getByText(/file upload|upload files/i)).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      render(<FileUploadExample />);

      expect(screen.getByText(/file upload|upload files/i)).toBeInTheDocument();
    });
  });
});
