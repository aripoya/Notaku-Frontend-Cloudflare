import { http, HttpResponse } from 'msw';
import { mockUser, mockNote, mockNotes, mockReceipt, mockReceipts } from './data';

const baseURL = 'https://api.notaku.cloud';

/**
 * MSW request handlers for API mocking
 * Simulates backend API responses for testing
 */
export const handlers = [
  // Health endpoints
  http.get(`${baseURL}/health`, () => {
    return HttpResponse.json({
      status: 'healthy',
      app: 'Notaku API',
      environment: 'test',
    });
  }),

  http.get(`${baseURL}/api/v1/info`, () => {
    return HttpResponse.json({
      name: 'Notaku API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        docs: '/docs',
      },
    });
  }),

  // Auth endpoints
  http.post(`${baseURL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      user: mockUser,
      message: 'Login successful',
    });
  }),

  http.post(`${baseURL}/api/v1/auth/register`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      user: { ...mockUser, email: body.email, username: body.username },
      message: 'Registration successful',
    }, { status: 201 });
  }),

  http.post(`${baseURL}/api/v1/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  }),

  http.get(`${baseURL}/api/v1/auth/me`, () => {
    return HttpResponse.json(mockUser);
  }),

  // Notes endpoints
  http.get(`${baseURL}/api/v1/notes`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const search = url.searchParams.get('search');
    const tags = url.searchParams.get('tags');

    let filteredNotes = [...mockNotes];

    // Filter by search
    if (search) {
      filteredNotes = filteredNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.content.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',');
      filteredNotes = filteredNotes.filter((note) =>
        tagArray.some((tag) => note.tags.includes(tag))
      );
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedNotes = filteredNotes.slice(start, end);

    return HttpResponse.json({
      items: paginatedNotes,
      total: filteredNotes.length,
      page,
      pageSize,
      totalPages: Math.ceil(filteredNotes.length / pageSize),
    });
  }),

  http.get(`${baseURL}/api/v1/notes/:id`, ({ params }) => {
    const note = mockNotes.find((n) => n.id === params.id) || mockNote;
    return HttpResponse.json(note);
  }),

  http.post(`${baseURL}/api/v1/notes`, async ({ request }) => {
    const body = (await request.json()) as any;
    const newNote = {
      ...mockNote,
      ...body,
      id: `note-new-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(newNote, { status: 201 });
  }),

  http.patch(`${baseURL}/api/v1/notes/:id`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    const updatedNote = {
      ...mockNote,
      ...body,
      id: params.id as string,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(updatedNote);
  }),

  http.delete(`${baseURL}/api/v1/notes/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  }),

  // Receipts endpoints
  http.get(`${baseURL}/api/v1/receipts`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedReceipts = mockReceipts.slice(start, end);

    return HttpResponse.json({
      items: paginatedReceipts,
      total: mockReceipts.length,
      page,
      pageSize,
      totalPages: Math.ceil(mockReceipts.length / pageSize),
    });
  }),

  http.get(`${baseURL}/api/v1/receipts/:id`, ({ params }) => {
    const receipt = mockReceipts.find((r) => r.id === params.id) || mockReceipt;
    return HttpResponse.json(receipt);
  }),

  http.post(`${baseURL}/api/v1/receipts/upload`, async () => {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return HttpResponse.json(mockReceipt, { status: 201 });
  }),

  http.patch(`${baseURL}/api/v1/receipts/:id`, async ({ request, params }) => {
    const body = (await request.json()) as any;
    const updatedReceipt = {
      ...mockReceipt,
      ...body,
      id: params.id as string,
    };
    return HttpResponse.json(updatedReceipt);
  }),

  http.delete(`${baseURL}/api/v1/receipts/:id`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  }),

  // AI Chat endpoints
  http.post(`${baseURL}/api/v1/chat`, async ({ request }) => {
    const body = (await request.json()) as any;
    return HttpResponse.json({
      message: `AI response to: ${body.message}`,
      conversationId: 'conv-001',
      timestamp: new Date().toISOString(),
    });
  }),

  // File upload endpoints
  http.post(`${baseURL}/api/v1/files/upload`, async () => {
    return HttpResponse.json({
      filename: 'test-file.jpg',
      storagePath: 'uploads/test/test-file.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      url: 'https://api.notaku.cloud/api/v1/files/uploads/test/test-file.jpg',
    }, { status: 201 });
  }),

  // Error scenarios for testing
  http.get(`${baseURL}/api/v1/error/500`, () => {
    return HttpResponse.json(
      { error: 'Internal server error', details: {} },
      { status: 500 }
    );
  }),

  http.get(`${baseURL}/api/v1/error/401`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized', details: {} },
      { status: 401 }
    );
  }),

  http.get(`${baseURL}/api/v1/error/404`, () => {
    return HttpResponse.json(
      { error: 'Not found', details: {} },
      { status: 404 }
    );
  }),
];
