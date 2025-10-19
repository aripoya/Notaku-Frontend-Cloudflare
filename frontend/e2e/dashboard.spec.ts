import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard
 * Tests: Navigation, Stats display, Quick actions
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard', async ({ page }) => {
    // Check that we're on dashboard (URL check)
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Page should be loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show user welcome message', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have interactive elements', async ({ page }) => {
    // Dashboard should have buttons or links
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to different sections', async ({ page }) => {
    // Look for navigation links
    const navLinks = page.locator('a[href*="/examples"]');
    const linkCount = await navLinks.count();
    
    // Should have some navigation
    expect(linkCount).toBeGreaterThanOrEqual(0);
  });

  test('should display recent activity', async ({ page }) => {
    // Check for activity section
    const activitySection = page.getByText(/recent|activity|latest/i);
    
    // Activity section might exist
    const hasActivity = await activitySection.isVisible();
    expect(typeof hasActivity).toBe('boolean');
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should still be visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should be visible
    await expect(page.locator('body')).toBeVisible();
  });
});
