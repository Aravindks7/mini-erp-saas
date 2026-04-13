import { test, expect } from '@playwright/test';

test.describe('Registration & Onboarding Flow', () => {
  const randomEmail = `test-${Math.random().toString(36).substring(2, 11)}@example.com`;
  const orgName = `Test Org ${Math.random().toString(36).substring(2, 6)}`;

  test('should register a new user and create their first organization', async ({ page }) => {
    // 1. Go to Register page
    await page.goto('/register');

    // 2. Fill registration form
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill(randomEmail);
    await page.getByLabel('Password').fill('Password123!');
    await page.click('button[type="submit"]');

    // 3. Should be redirected to onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByText('Create your workspace')).toBeVisible();

    // 4. Fill onboarding form
    await page.getByLabel('Organization Name').fill(orgName);

    // Select country from combobox
    // The label is associated with the input inside the combobox now
    const countryInput = page.getByLabel('Default Country');
    await countryInput.click();
    await page.getByRole('option', { name: 'United States' }).click();

    await page.click('button:has-text("Create Organization")');

    // 5. Should be redirected to dashboard (root)
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(orgName)).toBeVisible();
  });
});
