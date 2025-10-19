# 🧪 Testing Guide

Comprehensive testing documentation for the Notaku Frontend application.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Stack](#test-stack)
3. [Running Tests](#running-tests)
4. [Test Structure](#test-structure)
5. [Writing Tests](#writing-tests)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This project uses a comprehensive testing strategy:

- **Unit Tests**: Vitest + React Testing Library
- **Integration Tests**: Vitest + MSW (Mock Service Worker)
- **E2E Tests**: Playwright
- **Coverage**: Target 80%+ code coverage

---

## Test Stack

### Unit & Integration Testing
- **Vitest** - Fast unit test framework
- **React Testing Library** - Component testing
- **MSW** - API mocking
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom matchers

### E2E Testing
- **Playwright** - Cross-browser E2E testing
- Supports: Chromium, Firefox, WebKit
- Mobile testing: iOS Safari, Android Chrome

---

## Running Tests

### Install Dependencies

First time setup:
```bash
# Install all dependencies
npm install

# Install Playwright browsers
npm run playwright:install
```

### Unit Tests (Vitest)

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI (interactive)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

**Coverage Report:**
- HTML report: `coverage/index.html`
- Terminal summary after running `npm run test:coverage`

### E2E Tests (Playwright)

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests (step through)
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Generate test code
npm run playwright:codegen
```

### Run All Tests

```bash
# Run unit tests + E2E tests
npm run test:all
```

---

## Test Structure

### Directory Layout

```
frontend/
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── setup-tests.ts                # Test setup & globals
├── src/
│   ├── __tests__/                # Unit tests
│   │   ├── components/           # Component tests
│   │   ├── hooks/                # Hook tests
│   │   └── lib/                  # Utility tests
│   └── examples/
│       └── __tests__/            # Integration tests
├── e2e/                          # E2E tests
│   ├── auth.spec.ts
│   ├── notes.spec.ts
│   ├── receipts.spec.ts
│   ├── chat.spec.ts
│   └── dashboard.spec.ts
└── mocks/                        # Mock data & handlers
    ├── data.ts                   # Mock data
    ├── handlers.ts               # MSW handlers
    └── server.ts                 # MSW server
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts`
- Located next to source files or in `__tests__` directory

---

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText(/hello/i)).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText(/clicked/i)).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import NotesListExample from './NotesListExample';

describe('NotesListExample', () => {
  it('fetches and displays notes', async () => {
    render(<NotesListExample />);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByText(/Test Note 1/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

### Testing Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth());
    
    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });
    
    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

### Testing API Calls

API calls are automatically mocked using MSW. See `mocks/handlers.ts` for mock responses.

```typescript
// Tests automatically use mocked API responses
it('creates note successfully', async () => {
  const user = userEvent.setup();
  render(<CreateNoteForm />);
  
  await user.type(screen.getByLabelText(/title/i), 'New Note');
  await user.click(screen.getByRole('button', { name: /create/i }));
  
  await waitFor(() => {
    expect(screen.getByText(/note created/i)).toBeInTheDocument();
  });
});
```

---

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:**
```typescript
expect(component.state.count).toBe(5);
```

✅ **Good:**
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

❌ **Bad:**
```typescript
it('works', () => { ... });
```

✅ **Good:**
```typescript
it('displays error message when login fails', () => { ... });
```

### 3. Keep Tests Independent

Each test should be able to run independently without relying on other tests.

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    // Reset state before each test
    cleanup();
  });

  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

### 4. Test User Interactions

Use `@testing-library/user-event` for realistic user interactions:

```typescript
const user = userEvent.setup();

// Click
await user.click(button);

// Type
await user.type(input, 'text');

// Select
await user.selectOptions(select, 'option1');
```

### 5. Use Accessibility Queries

Prefer queries that reflect how users interact with your app:

```typescript
// ✅ Good - accessible
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// ❌ Avoid - implementation details
screen.getByClassName('submit-btn');
screen.getByTestId('email-input');
```

### 6. Test Error States

```typescript
it('displays error when API fails', async () => {
  // Mock API error
  server.use(
    http.get('/api/notes', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  render(<NotesList />);

  await waitFor(() => {
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
  });
});
```

### 7. Test Loading States

```typescript
it('shows loading spinner while fetching', () => {
  render(<NotesList />);
  
  expect(screen.getByRole('status')).toBeInTheDocument();
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### 8. Use waitFor for Async Operations

```typescript
await waitFor(() => {
  expect(screen.getByText(/success/i)).toBeInTheDocument();
}, { timeout: 5000 });
```

### 9. Clean Up After Tests

```typescript
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

### 10. Mock External Dependencies

```typescript
vi.mock('@/lib/api-client', () => ({
  default: {
    getNotes: vi.fn(() => Promise.resolve(mockNotes)),
  },
}));
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Coverage Requirements

Minimum coverage thresholds (configured in `vitest.config.ts`):
- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

---

## Troubleshooting

### Tests Failing Locally

**1. Clear cache:**
```bash
npm run test -- --clearCache
```

**2. Update snapshots:**
```bash
npm run test -- -u
```

**3. Check mock data:**
Verify mock data in `mocks/data.ts` and `mocks/handlers.ts`

### Playwright Issues

**1. Update browsers:**
```bash
npm run playwright:install
```

**2. Check baseURL:**
Ensure dev server is running on correct port in `playwright.config.ts`

**3. Increase timeout:**
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

**4. Debug with headed mode:**
```bash
npm run test:e2e:headed
```

### MSW Not Working

**1. Check server setup:**
Ensure `setup-tests.ts` imports and starts MSW server

**2. Verify handlers:**
Check `mocks/handlers.ts` for correct endpoint URLs

**3. Reset handlers:**
```typescript
afterEach(() => {
  server.resetHandlers();
});
```

### TypeScript Errors

**1. Install type definitions:**
```bash
npm install -D @types/node @types/react @types/react-dom
```

**2. Update tsconfig.json:**
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

### Flaky Tests

**1. Use waitFor:**
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

**2. Increase timeout:**
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 5000 });
```

**3. Avoid hardcoded delays:**
```typescript
// ❌ Bad
await new Promise(resolve => setTimeout(resolve, 1000));

// ✅ Good
await waitFor(() => expect(element).toBeInTheDocument());
```

---

## Resources

### Documentation
- [Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/)
- [MSW](https://mswjs.io/)

### Guides
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

### Tools
- [Testing Playground](https://testing-playground.com/) - Find best queries
- [Playwright Inspector](https://playwright.dev/docs/debug) - Debug E2E tests

---

## Quick Reference

### Common Queries

```typescript
// By role (preferred)
screen.getByRole('button', { name: /submit/i });

// By label
screen.getByLabelText(/email/i);

// By text
screen.getByText(/welcome/i);

// By placeholder
screen.getByPlaceholderText(/search/i);

// By alt text
screen.getByAltText(/logo/i);
```

### Common Assertions

```typescript
// Visibility
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).not.toBeInTheDocument();

// Text content
expect(element).toHaveTextContent('Hello');

// Attributes
expect(element).toHaveAttribute('href', '/about');
expect(element).toHaveClass('active');

// Form elements
expect(input).toHaveValue('test');
expect(checkbox).toBeChecked();
expect(button).toBeDisabled();
```

### User Events

```typescript
const user = userEvent.setup();

await user.click(button);
await user.dblClick(button);
await user.type(input, 'text');
await user.clear(input);
await user.selectOptions(select, 'value');
await user.upload(fileInput, file);
await user.hover(element);
await user.tab();
```

---

**Happy Testing! 🧪**

For questions or issues, check the troubleshooting section or consult the official documentation.
