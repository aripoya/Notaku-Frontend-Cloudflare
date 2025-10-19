# 🧪 Testing Setup Instructions

Quick setup guide for the Notaku Frontend testing infrastructure.

## 📦 Installation

### 1. Install Testing Dependencies

Run the following command to install all testing dependencies:

```bash
npm install
```

This will install:
- **Vitest** - Unit test framework
- **@vitest/ui** - Interactive test UI
- **@vitest/coverage-v8** - Coverage reporting
- **@testing-library/react** - React component testing
- **@testing-library/jest-dom** - Custom matchers
- **@testing-library/user-event** - User interaction simulation
- **@playwright/test** - E2E testing framework
- **MSW** - API mocking
- **jsdom** / **happy-dom** - DOM environment
- **lodash** - Utility functions

### 2. Install Playwright Browsers

After installing dependencies, install Playwright browsers:

```bash
npm run playwright:install
```

This installs Chromium, Firefox, and WebKit browsers for E2E testing.

---

## ✅ Verify Installation

### Check Vitest

```bash
npm run test -- --version
```

Should output Vitest version (e.g., `2.1.8`)

### Check Playwright

```bash
npx playwright --version
```

Should output Playwright version (e.g., `1.49.1`)

---

## 🚀 Quick Start

### Run Unit Tests

```bash
# Watch mode (recommended for development)
npm run test

# Run once
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

### Run E2E Tests

```bash
# Headless mode
npm run test:e2e

# With UI
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed
```

---

## 📁 Project Structure

```
frontend/
├── vitest.config.ts              # Vitest configuration
├── playwright.config.ts          # Playwright configuration
├── setup-tests.ts                # Test setup & globals
├── src/
│   ├── __tests__/                # Unit tests
│   │   ├── components/           # Component tests
│   │   │   ├── ErrorMessage.test.tsx
│   │   │   ├── Spinner.test.tsx
│   │   │   └── ProgressBar.test.tsx
│   │   ├── hooks/                # Hook tests (to be created)
│   │   └── lib/                  # Utility tests (to be created)
│   └── examples/
│       └── __tests__/            # Integration tests (to be created)
├── e2e/                          # E2E tests (to be created)
├── mocks/                        # Mock data & handlers
│   ├── data.ts                   # Mock data
│   ├── handlers.ts               # MSW handlers
│   └── server.ts                 # MSW server
└── docs/
    └── TESTING.md                # Full testing documentation
```

---

## 🔧 Configuration Files

### vitest.config.ts
- Test environment: jsdom
- Coverage provider: v8
- Coverage threshold: 80%
- Setup file: setup-tests.ts

### playwright.config.ts
- Base URL: http://localhost:3001
- Browsers: Chromium, Firefox, WebKit
- Mobile: Pixel 5, iPhone 12
- Auto-start dev server

### setup-tests.ts
- MSW server setup
- Global mocks (matchMedia, IntersectionObserver, etc.)
- Test utilities

---

## 📝 Available Scripts

### Unit Tests (Vitest)
```bash
npm run test              # Watch mode
npm run test:run          # Run once
npm run test:ui           # Interactive UI
npm run test:coverage     # With coverage report
```

### E2E Tests (Playwright)
```bash
npm run test:e2e          # Run E2E tests
npm run test:e2e:ui       # Interactive UI
npm run test:e2e:headed   # See browser
npm run test:e2e:debug    # Debug mode
npm run test:e2e:report   # View report
```

### Utilities
```bash
npm run test:all                    # Run all tests
npm run playwright:install          # Install browsers
npm run playwright:codegen          # Generate tests
```

---

## 🎯 Next Steps

1. **Read the full documentation**: `docs/TESTING.md`
2. **Run existing tests**: `npm run test`
3. **Write your first test**: See examples in `src/__tests__/`
4. **Run E2E tests**: `npm run test:e2e`

---

## 🐛 Troubleshooting

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Playwright Browsers Not Installing

```bash
# Install with dependencies
npx playwright install --with-deps
```

### Tests Not Running

```bash
# Check Node version (should be 18+)
node --version

# Clear Vitest cache
npm run test -- --clearCache
```

### Port Already in Use

If port 3001 is in use, update `playwright.config.ts`:

```typescript
use: {
  baseURL: 'http://localhost:YOUR_PORT',
}
```

---

## 📚 Resources

- **Full Documentation**: [docs/TESTING.md](./docs/TESTING.md)
- **Vitest Docs**: https://vitest.dev/
- **Playwright Docs**: https://playwright.dev/
- **Testing Library**: https://testing-library.com/

---

## ✨ What's Included

### ✅ Completed
- Vitest configuration
- Playwright configuration
- Test setup with MSW
- Mock data and handlers
- Component tests (ErrorMessage, Spinner, ProgressBar)
- Testing documentation

### 🚧 To Be Created
- Hook tests (useAuth, useNotes, etc.)
- Integration tests (Example components)
- E2E tests (auth, notes, receipts, chat, dashboard)
- Additional unit tests

---

**Ready to test!** 🧪

Run `npm run test` to start testing in watch mode.
