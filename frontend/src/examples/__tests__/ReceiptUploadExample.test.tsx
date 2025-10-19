import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

describe('ReceiptUploadExample Component - Simplified', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render upload interface with title', () => {
      render(<ReceiptUploadExample />);

      expect(screen.getByText(/receipt ocr upload/i)).toBeInTheDocument();
    });

    it('should render file input', () => {
      render(<ReceiptUploadExample />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
    });

    it('should render upload instructions', () => {
      render(<ReceiptUploadExample />);

      // Check for upload-related text (exact text from component)
      expect(screen.getByText(/drag and drop your receipt here/i)).toBeInTheDocument();
    });

    it('should have file input with image accept attribute', () => {
      render(<ReceiptUploadExample />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput?.accept).toContain('image');
    });
  });

  describe('Feature Cards', () => {
    it('should display feature descriptions', () => {
      render(<ReceiptUploadExample />);

      // Check for feature highlights (exact text from component)
      expect(screen.getByText('Easy Upload')).toBeInTheDocument();
      expect(screen.getByText('AI Powered')).toBeInTheDocument();
      expect(screen.getByText('Fast Processing')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have proper component structure', () => {
      const { container } = render(<ReceiptUploadExample />);

      // Component renders without crashing
      expect(container).toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<ReceiptUploadExample />);

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept');
    });
  });

  describe('Integration Points', () => {
    it('should use useFileUpload hook', () => {
      // Hook integration tested through component behavior
      // Direct hook testing in useApi.test.ts
      render(<ReceiptUploadExample />);
      expect(screen.getByText(/receipt ocr upload/i)).toBeInTheDocument();
    });
  });
});
