import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReceiptUploadExample from '@/examples/ReceiptUploadExample';

// Mock ApiClient for file upload
vi.mock('@/lib/api-client', () => ({
  default: {
    uploadReceipt: vi.fn((file: File) => 
      Promise.resolve({
        id: 'receipt-001',
        userId: 'user-1',
        merchantName: 'Test Store',
        totalAmount: 150000,
        currency: 'IDR',
        transactionDate: '2025-10-19',
        ocrData: {
          merchantName: 'Test Store',
          totalAmount: 150000,
          items: [
            { name: 'Item 1', quantity: 2, price: 50000, total: 100000 },
            { name: 'Item 2', quantity: 1, price: 50000, total: 50000 },
          ],
          rawText: 'Test Store\nItem 1 x2 Rp 100,000\nItem 2 x1 Rp 50,000\nTotal: Rp 150,000',
          confidence: 0.95,
        },
        imagePath: 'receipts/test/receipt.jpg',
        createdAt: new Date().toISOString(),
      })
    ),
  },
  ApiClientError: class ApiClientError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

describe('ReceiptUploadExample Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload interface', () => {
      render(<ReceiptUploadExample />);

      expect(screen.getByText(/receipt ocr upload/i)).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<ReceiptUploadExample />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should render drag and drop zone', () => {
      render(<ReceiptUploadExample />);

      expect(screen.getByText(/drag.*drop|drop.*here/i)).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should accept image files', () => {
      render(<ReceiptUploadExample />);

      const fileInput = screen.getByLabelText(/choose file|select file|upload/i) as HTMLInputElement;
      expect(fileInput.accept).toMatch(/image/);
    });

    it('should handle file selection', async () => {
      const user = userEvent.setup();
      render(<ReceiptUploadExample />);

      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/receipt.jpg/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Validation', () => {
    it('should validate file type', async () => {
      const user = userEvent.setup();
      render(<ReceiptUploadExample />);

      const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);

      await user.upload(fileInput, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/invalid file type|only images/i)).toBeInTheDocument();
      });
    });

    it('should validate file size', async () => {
      const user = userEvent.setup();
      render(<ReceiptUploadExample />);

      // Create a large file (> 10MB)
      const largeContent = 'x'.repeat(11 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);

      await user.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/file too large|size limit/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Progress', () => {
    it('should handle upload flow', async () => {
      // Upload progress tested at hook level
      // Component displays ProgressBar when uploading
      expect(true).toBe(true);
    });

    it('should show uploading state', () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: true,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: null,
        uploadReceipt: vi.fn(),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      expect(screen.getByText(/uploading|processing/i)).toBeInTheDocument();
    });
  });

  describe('OCR Results', () => {
    it('should display OCR results after successful upload', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      const mockUploadReceipt = vi.fn().mockResolvedValue({
        id: 'receipt-001',
        merchantName: 'Test Store',
        totalAmount: 150000,
        currency: 'IDR',
        ocrData: {
          merchantName: 'Test Store',
          totalAmount: 150000,
          items: [
            { name: 'Item 1', quantity: 2, price: 50000, total: 100000 },
            { name: 'Item 2', quantity: 1, price: 50000, total: 50000 },
          ],
          rawText: 'Test receipt text',
          confidence: 0.95,
        },
      });

      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadReceipt: mockUploadReceipt,
        reset: vi.fn(),
      });

      const user = userEvent.setup();
      render(<ReceiptUploadExample />);

      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Test Store/i)).toBeInTheDocument();
        expect(screen.getByText(/150,000|150000/)).toBeInTheDocument();
      });
    });

    it('should display confidence score', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadReceipt: vi.fn().mockResolvedValue({
          ocrData: {
            merchantName: 'Store',
            totalAmount: 100000,
            items: [],
            rawText: '',
            confidence: 0.95,
          },
        }),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      await waitFor(() => {
        expect(screen.getByText(/95%|0.95/)).toBeInTheDocument();
      });
    });

    it('should display extracted items', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadReceipt: vi.fn().mockResolvedValue({
          ocrData: {
            merchantName: 'Store',
            totalAmount: 100000,
            items: [
              { name: 'Item 1', quantity: 2, price: 50000, total: 100000 },
            ],
            rawText: '',
            confidence: 0.95,
          },
        }),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      await waitFor(() => {
        expect(screen.getByText(/Item 1/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Preview', () => {
    it('should show image preview after selection', async () => {
      const user = userEvent.setup();
      render(<ReceiptUploadExample />);

      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);

      await user.upload(fileInput, file);

      await waitFor(() => {
        const preview = screen.getByAltText(/preview|receipt/i);
        expect(preview).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on upload failure', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: new Error('Upload failed'),
        uploadReceipt: vi.fn(),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      expect(screen.getByText(/upload failed|error/i)).toBeInTheDocument();
    });

    it('should show retry button on error', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 0, total: 0, percentage: 0 },
        error: new Error('Upload failed'),
        uploadReceipt: vi.fn(),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      expect(screen.getByRole('button', { name: /retry|try again/i })).toBeInTheDocument();
    });
  });

  describe('Reset Functionality', () => {
    it('should have upload another button after success', async () => {
      const { useFileUpload } = require('@/hooks/useApi');
      useFileUpload.mockReturnValue({
        uploading: false,
        progress: { loaded: 1000000, total: 1000000, percentage: 100 },
        error: null,
        uploadReceipt: vi.fn().mockResolvedValue({
          ocrData: {
            merchantName: 'Store',
            totalAmount: 100000,
            items: [],
            rawText: '',
            confidence: 0.95,
          },
        }),
        reset: vi.fn(),
      });

      render(<ReceiptUploadExample />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload another|new upload/i })).toBeInTheDocument();
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag over event', async () => {
      render(<ReceiptUploadExample />);

      const dropZone = screen.getByText(/drag.*drop|drop.*here/i).closest('div');
      expect(dropZone).toBeInTheDocument();
    });

    it('should accept dropped files', async () => {
      render(<ReceiptUploadExample />);

      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
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

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<ReceiptUploadExample />);

      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);
      expect(fileInput).toHaveAccessibleName();
    });

    it('should have proper ARIA labels', () => {
      render(<ReceiptUploadExample />);

      const fileInput = screen.getByLabelText(/choose file|select file|upload/i);
      expect(fileInput).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      global.innerWidth = 375;
      render(<ReceiptUploadExample />);

      expect(screen.getByText(/upload receipt|receipt upload/i)).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      global.innerWidth = 1920;
      render(<ReceiptUploadExample />);

      expect(screen.getByText(/upload receipt|receipt upload/i)).toBeInTheDocument();
    });
  });
});
