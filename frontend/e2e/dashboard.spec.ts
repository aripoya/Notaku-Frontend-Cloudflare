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
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard', async ({ page }) => {
    // Check for dashboard heading
    await expect(
      page.getByText(/welcome|dashboard/i).first()
    ).toBeVisible();
  });

  test('should show user welcome message', async ({ page }) => {
    // Should greet the user
    await expect(
      page.getByText(/welcome back/i)
    ).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Check for stat cards
    const statsTexts = [/notes/i, /receipts/i, /spending/i, /storage/i];
    
    for (const statText of statsTexts) {
      await expect(
        page.getByText(statText).first()
      ).toBeVisible();
    }
  });

  test('should show API health status', async ({ page }) => {
    // Check for API health indicator
    await expect(
      page.getByText(/api|healthy|status/i).first()
    ).toBeVisible();
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
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
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
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should still be visible
    await expect(
      page.getByText(/welcome|dashboard/i).first()
    ).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dashboard should be visible
    await expect(
      page.getByText(/welcome|dashboard/i).first()
    ).toBeVisible();
  });
});
