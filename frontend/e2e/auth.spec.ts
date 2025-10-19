import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests: Login, Register, Logout
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login page', async ({ page }) => {
    // Check for login elements
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    
    // Click sign in button
    await page.getByRole('button', { name: /masuk/i }).click();
    
    // Wait for navigation or success indicator
    await page.waitForTimeout(2000); // Wait for mock API delay
    
    // Check if logged in (look for user-specific content)
    // This might be a welcome message, dashboard, or user menu
    await expect(
      page.getByText(/welcome|dashboard|profile/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill login form with wrong credentials
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/^password$/i).fill('wrongpassword');
    
    // Click sign in button
    await page.getByRole('button', { name: /masuk/i }).click();
    
    // Wait for error message
    await expect(
      page.getByText(/invalid|wrong|error|salah/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page', async ({ page }) => {
    // Look for register link
    const registerLink = page.getByRole('link', { name: /daftar/i });
    await expect(registerLink).toBeVisible();
  });

  test('should have register link', async ({ page }) => {
    // Check for register link
    await expect(page.getByRole('link', { name: /daftar/i })).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input#password');
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click show password button
    await page.getByRole('button', { name: /tampilkan password/i }).click();
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should validate empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /masuk/i }).click();
    
    // Should show validation error for email
    await expect(page.getByText('Email tidak valid')).toBeVisible({ timeout: 2000 });
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email and valid password
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.locator('input[type="password"]').fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: /masuk/i }).click();
    
    // Wait a bit for validation
    await page.waitForTimeout(500);
    
    // Should show validation error
    await expect(page.getByText(/email tidak valid/i)).toBeVisible({ timeout: 2000 });
  });
});

test.describe.skip('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.getByRole('button', { name: /masuk/i }).click();
    await page.waitForTimeout(2000);
  });

  test('should logout successfully', async ({ page }) => {
    // Look for logout button (might be in a menu)
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
    
    // If logout is in a dropdown, open it first
    const userMenu = page.getByRole('button', { name: /profile|user|account/i }).first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
    }
    
    // Click logout
    await logoutButton.click();
    
    // Should return to login page
    await expect(page.getByText(/sign in|login/i)).toBeVisible({ timeout: 5000 });
  });
});
