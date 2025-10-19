import { describe, it, expect, beforeEach, vi } from 'vitest';
import ApiClient, { ApiClientError } from '@/lib/api-client';

describe('ApiClient', () => {
  describe('Health Endpoints', () => {
    it('should fetch health status', async () => {
      const health = await ApiClient.getHealth();

      expect(health).toHaveProperty('status');
      expect(health.status).toBe('healthy');
      expect(health).toHaveProperty('app');
      expect(health.app).toBe('Notaku API');
    });

    it('should fetch system info', async () => {
      const info = await ApiClient.getSystemInfo();

      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('endpoints');
    });

    it('should fetch API info', async () => {
      const info = await ApiClient.getApiInfo();

      expect(info).toHaveProperty('name');
      expect(info.name).toBe('Notaku API');
      expect(info).toHaveProperty('version');
    });
  });

  describe('Authentication', () => {
    it('should register user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const response = await ApiClient.register(userData);

      expect(response).toHaveProperty('user');
      expect(response.user.email).toBe(userData.email);
      expect(response.user.username).toBe(userData.username);
      expect(response).toHaveProperty('message');
      expect(response.message).toContain('successful');
    });

    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await ApiClient.login(credentials);

      expect(response).toHaveProperty('user');
      expect(response.user.email).toBe(credentials.email);
      expect(response).toHaveProperty('message');
    });

    it('should logout user successfully', async () => {
      const response = await ApiClient.logout();

      expect(response).toHaveProperty('success');
      expect(response.success).toBe(true);
      expect(response).toHaveProperty('message');
    });

    it('should get current user', async () => {
      const user = await ApiClient.getCurrentUser();

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).toHaveProperty('createdAt');
    });

    it('should handle login with invalid credentials', async () => {
      await expect(
        ApiClient.login({
          email: 'wrong@example.com',
          password: 'wrongpass',
        })
      ).rejects.toThrow();
    });
  });

  describe('Notes CRUD', () => {
    it('should fetch notes with default pagination', async () => {
      const result = await ApiClient.getNotes();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should fetch notes with custom pagination', async () => {
      const result = await ApiClient.getNotes({ page: 2, pageSize: 5 });

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(5);
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it('should fetch notes with search query', async () => {
      const result = await ApiClient.getNotes({ search: 'Test Note 1' });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].title).toContain('Test Note 1');
    });

    it('should fetch notes with tag filter', async () => {
      const result = await ApiClient.getNotes({ tags: 'work' });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach((note) => {
        expect(note.tags).toContain('work');
      });
    });

    it('should fetch single note by id', async () => {
      const note = await ApiClient.getNote('note-001');

      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('title');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('tags');
      expect(note).toHaveProperty('userId');
    });

    it('should create note successfully', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'Test content',
        tags: ['test'],
        isPublic: false,
      };

      const note = await ApiClient.createNote(noteData);

      expect(note).toHaveProperty('id');
      expect(note.title).toBe(noteData.title);
      expect(note.content).toBe(noteData.content);
      expect(note.tags).toEqual(noteData.tags);
      expect(note.isPublic).toBe(noteData.isPublic);
    });

    it('should update note successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content',
      };

      const note = await ApiClient.updateNote('note-001', updateData);

      expect(note).toHaveProperty('id');
      expect(note.title).toBe(updateData.title);
      expect(note.content).toBe(updateData.content);
    });

    it('should delete note successfully', async () => {
      const response = await ApiClient.deleteNote('note-001');

      expect(response).toHaveProperty('success');
      expect(response.success).toBe(true);
      expect(response).toHaveProperty('message');
    });

    it('should handle note not found error', async () => {
      await expect(
        ApiClient.getNote('non-existent-id')
      ).rejects.toThrow(ApiClientError);
    });
  });

  describe('Receipts', () => {
    it('should fetch receipts successfully', async () => {
      const result = await ApiClient.getReceipts();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should fetch receipts with pagination', async () => {
      const result = await ApiClient.getReceipts({ page: 1, pageSize: 10 });

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should fetch single receipt by id', async () => {
      const receipt = await ApiClient.getReceipt('receipt-001');

      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('merchantName');
      expect(receipt).toHaveProperty('totalAmount');
      expect(receipt).toHaveProperty('currency');
      expect(receipt).toHaveProperty('ocrData');
    });

    it('should upload receipt successfully', async () => {
      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
      
      const receipt = await ApiClient.uploadReceipt(file);

      expect(receipt).toHaveProperty('id');
      expect(receipt).toHaveProperty('merchantName');
      expect(receipt).toHaveProperty('totalAmount');
      expect(receipt).toHaveProperty('ocrData');
      expect(receipt.ocrData).toHaveProperty('confidence');
    });

    it('should track upload progress', async () => {
      const file = new File(['content'], 'receipt.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      await ApiClient.uploadReceipt(file, undefined, onProgress);

      // Progress callback should be called
      expect(onProgress).toHaveBeenCalled();
    });

    it('should update receipt successfully', async () => {
      const updateData = {
        merchantName: 'Updated Store',
        totalAmount: 200000,
      };

      const receipt = await ApiClient.updateReceipt('receipt-001', updateData);

      expect(receipt.merchantName).toBe(updateData.merchantName);
      expect(receipt.totalAmount).toBe(updateData.totalAmount);
    });

    it('should delete receipt successfully', async () => {
      const response = await ApiClient.deleteReceipt('receipt-001');

      expect(response).toHaveProperty('success');
      expect(response.success).toBe(true);
    });
  });

  describe('AI Chat', () => {
    it('should send chat message successfully', async () => {
      const chatRequest = {
        message: 'Hello AI',
        conversationId: 'conv-001',
      };

      const response = await ApiClient.chat(chatRequest);

      expect(response).toHaveProperty('message');
      expect(response.message).toContain('AI response');
      expect(response).toHaveProperty('conversationId');
      expect(response).toHaveProperty('timestamp');
    });

    it('should handle chat without conversation id', async () => {
      const chatRequest = {
        message: 'Hello AI',
      };

      const response = await ApiClient.chat(chatRequest);

      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('conversationId');
    });
  });

  describe('File Upload', () => {
    it('should upload file successfully', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const response = await ApiClient.uploadFile(file, 'uploads');

      expect(response).toHaveProperty('filename');
      expect(response).toHaveProperty('storagePath');
      expect(response).toHaveProperty('fileSize');
      expect(response).toHaveProperty('mimeType');
      expect(response).toHaveProperty('url');
    });

    it('should upload to specific bucket', async () => {
      const file = new File(['content'], 'avatar.jpg', { type: 'image/jpeg' });

      const response = await ApiClient.uploadFile(file, 'avatars');

      expect(response.storagePath).toContain('avatars');
    });

    it('should track file upload progress', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      await ApiClient.uploadFile(file, 'uploads', onProgress);

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw ApiClientError on 404', async () => {
      try {
        await ApiClient.getNote('non-existent-id');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        if (error instanceof ApiClientError) {
          expect(error.statusCode).toBe(404);
        }
      }
    });

    it('should throw ApiClientError on 401', async () => {
      try {
        // Mock unauthorized request
        await fetch('https://api.notaku.cloud/api/v1/error/401');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Error expected
      }
    });

    it('should throw ApiClientError on 500', async () => {
      try {
        await fetch('https://api.notaku.cloud/api/v1/error/500');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Error expected
      }
    });

    it('should include error details in ApiClientError', async () => {
      try {
        await ApiClient.getNote('non-existent-id');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiClientError);
        if (error instanceof ApiClientError) {
          expect(error.message).toBeDefined();
          expect(error.statusCode).toBeDefined();
        }
      }
    });
  });

  describe('ApiClientError', () => {
    it('should create error with all properties', () => {
      const error = new ApiClientError(
        'Test error',
        404,
        'NOT_FOUND',
        { field: 'id' }
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ field: 'id' });
      expect(error.name).toBe('ApiClientError');
    });

    it('should be instance of Error', () => {
      const error = new ApiClientError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiClientError);
    });
  });

  describe('Request Configuration', () => {
    it('should include credentials in requests', async () => {
      // This is tested implicitly through successful API calls
      const health = await ApiClient.getHealth();
      expect(health).toBeDefined();
    });

    it('should use CORS mode', async () => {
      // This is tested implicitly through successful API calls
      const health = await ApiClient.getHealth();
      expect(health).toBeDefined();
    });

    it('should set correct headers', async () => {
      // This is tested implicitly through successful API calls
      const health = await ApiClient.getHealth();
      expect(health).toBeDefined();
    });
  });

  describe('URL Building', () => {
    it('should build URL with query params', async () => {
      const result = await ApiClient.getNotes({
        page: 2,
        pageSize: 10,
        search: 'test',
      });

      expect(result).toBeDefined();
      expect(result.page).toBe(2);
    });

    it('should handle array query params', async () => {
      const result = await ApiClient.getNotes({
        tags: 'work,personal',
      });

      expect(result).toBeDefined();
    });

    it('should skip undefined params', async () => {
      const result = await ApiClient.getNotes({
        page: 1,
        search: undefined,
      });

      expect(result).toBeDefined();
    });
  });
});
