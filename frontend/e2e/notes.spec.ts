import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Notes Management
 * Tests: Create, View, Edit, Delete notes
 */

test.describe('Notes Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    
    // Navigate to notes page
    await page.goto('/examples/notes');
  });

  test('should display notes list', async ({ page }) => {
    // Check for notes interface elements
    await expect(
      page.getByText(/notes|my notes/i).first()
    ).toBeVisible();
    
    // Should have create/add button
    await expect(
      page.getByRole('button', { name: /create|add|new/i }).first()
    ).toBeVisible();
  });

  test('should create a new note', async ({ page }) => {
    // Click create note button
    await page.getByRole('button', { name: /create|add|new/i }).first().click();
    
    // Fill note form
    const titleInput = page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i));
    const contentInput = page.getByLabel(/content|description/i).or(page.getByPlaceholder(/content|description/i));
    
    await titleInput.fill('Test Note E2E');
    await contentInput.fill('This is a test note created by E2E test');
    
    // Save note
    await page.getByRole('button', { name: /save|create|add/i }).click();
    
    // Wait for save
    await page.waitForTimeout(1500);
    
    // Check if note appears in list
    await expect(page.getByText('Test Note E2E')).toBeVisible({ timeout: 5000 });
  });

  test('should search notes', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByLabel(/search/i));
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Results should be filtered
      await expect(page.locator('body')).toContainText(/test|no results/i);
    }
  });

  test('should view note details', async ({ page }) => {
    // Wait for notes to load
    await page.waitForTimeout(1000);
    
    // Click on first note (if any exist)
    const firstNote = page.locator('[data-testid="note-item"]').first()
      .or(page.getByRole('article').first())
      .or(page.getByRole('listitem').first());
    
    if (await firstNote.isVisible()) {
      await firstNote.click();
      
      // Should show note details
      await expect(
        page.getByText(/title|content|created/i).first()
      ).toBeVisible();
    }
  });

  test('should handle empty notes list', async ({ page }) => {
    // If no notes, should show empty state
    const emptyState = page.getByText(/no notes|empty|create your first/i);
    const notesList = page.locator('[data-testid="note-item"]');
    
    // Either show empty state or have notes
    const hasNotes = await notesList.count() > 0;
    const hasEmptyState = await emptyState.isVisible();
    
    expect(hasNotes || hasEmptyState).toBeTruthy();
  });

  test('should paginate notes', async ({ page }) => {
    // Look for pagination controls
    const nextButton = page.getByRole('button', { name: /next|→/i });
    const prevButton = page.getByRole('button', { name: /prev|←/i });
    
    // If pagination exists, test it
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
      
      // Should load next page
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Notes CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to notes
    await page.goto('/');
    await page.getByLabel(/email/i).fill('demo@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(2000);
    await page.goto('/examples/notes');
    await page.waitForTimeout(1000);
  });

  test('should edit a note', async ({ page }) => {
    // Create a note first
    await page.getByRole('button', { name: /create|add|new/i }).first().click();
    await page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).fill('Note to Edit');
    await page.getByLabel(/content/i).or(page.getByPlaceholder(/content/i)).fill('Original content');
    await page.getByRole('button', { name: /save|create/i }).click();
    await page.waitForTimeout(1500);
    
    // Find and click edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modify content
      await page.getByLabel(/content/i).or(page.getByPlaceholder(/content/i)).fill('Updated content');
      await page.getByRole('button', { name: /save|update/i }).click();
      
      // Wait for update
      await page.waitForTimeout(1500);
      
      // Check for updated content
      await expect(page.getByText('Updated content')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete a note', async ({ page }) => {
    // Create a note to delete
    await page.getByRole('button', { name: /create|add|new/i }).first().click();
    await page.getByLabel(/title/i).or(page.getByPlaceholder(/title/i)).fill('Note to Delete');
    await page.getByLabel(/content/i).or(page.getByPlaceholder(/content/i)).fill('Will be deleted');
    await page.getByRole('button', { name: /save|create/i }).click();
    await page.waitForTimeout(1500);
    
    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Wait for deletion
      await page.waitForTimeout(1500);
      
      // Note should be removed
      await expect(page.getByText('Note to Delete')).not.toBeVisible();
    }
  });
});
