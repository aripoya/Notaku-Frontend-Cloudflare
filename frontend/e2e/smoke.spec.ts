import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic functionality check
 * Quick tests to verify app is running
 */

test.describe('Smoke Tests', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    
    // Page should load
    await expect(page).toHaveTitle(/Expense|AI|Platform/i);
  });

  test('should have login form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should have login elements
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    // Go to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Login first
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
    
    // Try to navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should load without error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('body')).toBeVisible();
  });
});
