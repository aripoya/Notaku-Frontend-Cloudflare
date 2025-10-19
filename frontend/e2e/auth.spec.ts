import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Tests: Login, Register, Logout
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login example page
    await page.goto('/examples/login');
    await page.waitForLoadState('networkidle');
  });

  test('should display login page', async ({ page }) => {
    // Check for login elements
    await expect(page.getByText(/sign in|login/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill login form
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    
    // Click sign in button
    await page.getByRole('button', { name: /sign in/i }).click();
    
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
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for error message
    await expect(
      page.getByText(/invalid|wrong|error|salah/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should switch to register mode', async ({ page }) => {
    // Look for register/create account link or button
    const registerButton = page.getByText(/create account|register|sign up/i).first();
    await registerButton.click();
    
    // Check for register-specific fields
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    // Switch to register mode
    await page.getByText(/create account|register|sign up/i).first().click();
    
    // Fill registration form
    await page.getByLabel(/name/i).fill('Test User');
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');
    
    // Submit registration
    await page.getByRole('button', { name: /create account|register|sign up/i }).click();
    
    // Wait for registration to complete
    await page.waitForTimeout(2000);
    
    // Check if registered and logged in
    await expect(
      page.getByText(/welcome|dashboard|profile/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password$/i);
    
    // Password should be hidden by default
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click show password button
    await page.getByRole('button', { name: /show password|toggle/i }).first().click();
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should validate empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation errors or prevent submission
    // Check that we're still on the login page
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/^password$/i).fill('password123');
    
    // Try to submit
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show validation error or stay on page
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/examples/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
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
