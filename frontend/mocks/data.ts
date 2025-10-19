import type { User, Note, Receipt, Attachment } from '@/types/api';

/**
 * Mock data for testing
 * Provides realistic test data for all API entities
 */

export const mockUser: User = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: '2025-10-19T00:00:00Z',
  updatedAt: '2025-10-19T00:00:00Z',
  lastLogin: '2025-10-19T06:00:00Z',
  isActive: true,
};

export const mockNote: Note = {
  id: 'note-001',
  userId: mockUser.id,
  title: 'Test Note',
  content: 'This is a test note content for testing purposes.',
  tags: ['test', 'sample'],
  isPublic: false,
  createdAt: '2025-10-19T00:00:00Z',
  updatedAt: '2025-10-19T00:00:00Z',
};

export const mockNotes: Note[] = Array.from({ length: 10 }, (_, i) => ({
  id: `note-${String(i + 1).padStart(3, '0')}`,
  userId: mockUser.id,
  title: `Test Note ${i + 1}`,
  content: `This is test note number ${i + 1} with some sample content.`,
  tags: i % 2 === 0 ? ['work', 'important'] : ['personal'],
  isPublic: i % 3 === 0,
  createdAt: new Date(2025, 9, 19 - i).toISOString(),
  updatedAt: new Date(2025, 9, 19 - i).toISOString(),
}));

export const mockReceipt: Receipt = {
  id: 'receipt-001',
  userId: mockUser.id,
  merchantName: 'Test Store',
  totalAmount: 150000,
  currency: 'IDR',
  transactionDate: '2025-10-19',
  ocrData: {
    merchantName: 'Test Store',
    totalAmount: 150000,
    items: [
      {
        name: 'Item 1',
        quantity: 2,
        price: 50000,
        total: 100000,
      },
      {
        name: 'Item 2',
        quantity: 1,
        price: 50000,
        total: 50000,
      },
    ],
    rawText: 'Test Store\nItem 1 x2 Rp 100,000\nItem 2 x1 Rp 50,000\nTotal: Rp 150,000',
    confidence: 0.95,
  },
  imagePath: 'receipts/test/receipt-001.jpg',
  createdAt: '2025-10-19T00:00:00Z',
};

export const mockReceipts: Receipt[] = Array.from({ length: 5 }, (_, i) => ({
  id: `receipt-${String(i + 1).padStart(3, '0')}`,
  userId: mockUser.id,
  merchantName: `Store ${i + 1}`,
  totalAmount: (i + 1) * 100000,
  currency: 'IDR',
  transactionDate: new Date(2025, 9, 19 - i).toISOString().split('T')[0],
  ocrData: {
    merchantName: `Store ${i + 1}`,
    totalAmount: (i + 1) * 100000,
    items: [],
    rawText: `Store ${i + 1}\nTotal: Rp ${(i + 1) * 100000}`,
    confidence: 0.9 + i * 0.01,
  },
  imagePath: `receipts/test/receipt-${String(i + 1).padStart(3, '0')}.jpg`,
  createdAt: new Date(2025, 9, 19 - i).toISOString(),
}));

export const mockAttachment: Attachment = {
  id: 'attachment-001',
  noteId: mockNote.id,
  userId: mockUser.id,
  filename: 'test-file.pdf',
  mimeType: 'application/pdf',
  fileSize: 1024000,
  storagePath: 'attachments/test/test-file.pdf',
  createdAt: '2025-10-19T00:00:00Z',
};

/**
 * Helper function to generate mock notes
 */
export function generateMockNotes(count: number): Note[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `note-gen-${i}`,
    userId: mockUser.id,
    title: `Generated Note ${i + 1}`,
    content: `Content for generated note ${i + 1}`,
    tags: ['generated'],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Helper function to generate mock receipts
 */
export function generateMockReceipts(count: number): Receipt[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `receipt-gen-${i}`,
    userId: mockUser.id,
    merchantName: `Merchant ${i + 1}`,
    totalAmount: (i + 1) * 50000,
    currency: 'IDR',
    transactionDate: new Date().toISOString().split('T')[0],
    ocrData: {
      merchantName: `Merchant ${i + 1}`,
      totalAmount: (i + 1) * 50000,
      items: [],
      rawText: '',
      confidence: 0.9,
    },
    imagePath: `receipts/test/gen-${i}.jpg`,
    createdAt: new Date().toISOString(),
  }));
}
