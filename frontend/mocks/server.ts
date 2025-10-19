import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW server setup for Node.js environment (Vitest)
 * This server intercepts HTTP requests during tests
 */
export const server = setupServer(...handlers);
