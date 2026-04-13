import { test, expect, type Page } from '@playwright/test';

async function registerAndOnboard(page: Page) {
  const randomEmail = `test-cust-${Math.random().toString(36).substring(2, 11)}@example.com`;
  const orgName = `Customer Test Org ${Math.random().toString(36).substring(2, 6)}`;

  await page.goto('/register');
  await page.getByLabel('Full Name').fill('Customer Tester');
  await page.getByLabel('Email').fill(randomEmail);
  await page.getByLabel('Password').fill('Password123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel('Organization Name').fill(orgName);

  await page.getByLabel('Default Country').click();
  await page.getByRole('option', { name: 'United States' }).click();
  await page.click('button:has-text("Create Organization")');

  await expect(page).toHaveURL(/\/$/);
  return { orgName };
}

test.describe('Customer Lifecycle', () => {
  test('should create, list, and delete a customer with nested data', async ({ page }) => {
    const { orgName } = await registerAndOnboard(page);
    const customerName = `Acme Corp ${Math.random().toString(36).substring(2, 6)}`;

    // 1. Navigate to Customers
    await page.click('a:has-text("Customers")');
    await expect(page.getByText('Manage your client base')).toBeVisible();

    // 2. Click Add Customer
    await page.click('button:has-text("Add Customer")');
    await expect(page).toHaveURL(/\/customers\/new/);

    // 3. Fill Global Info
    await page.getByLabel('Company Name').fill(customerName);
    await page.getByLabel('Tax Number (Optional)').fill('VAT-12345');

    // 4. Add Address
    await page.click('button:has-text("Add Address")');
    await page.getByLabel('Address Line 1').fill('123 Business St');
    await page.getByLabel('City').fill('San Francisco');
    await page.getByLabel('State/Province').fill('CA');
    await page.getByLabel('Postal Code').fill('94105');

    // Select country in address
    await page.getByLabel('Country').click();
    await page.getByRole('option', { name: 'United States' }).click();

    // 5. Add Contact
    await page.click('button:has-text("Add Contact")');
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');

    // Use precise locator for contact email to avoid ambiguity
    await page.locator('input[name="contacts.0.email"]').fill('john@acme.com');
    await page.getByLabel('Phone').fill('555-0199');

    // 6. Submit
    await page.click('button:has-text("Save Customer")');

    // 7. Verify redirection to Details Page
    // The URL should be /customers/[uuid]
    await expect(page).toHaveURL(/\/customers\/[0-9a-f-]+$/);
    await expect(page.getByText(customerName).first()).toBeVisible();

    // Verify Address (under tab)
    await page.click('button:has-text("Addresses")');
    await expect(page.getByText('123 Business St')).toBeVisible();

    // Verify Contact (under tab)
    await page.click('button:has-text("Contacts")');
    await expect(page.getByText('John Doe')).toBeVisible();

    // 8. Go back to list to verify appearance and then delete
    await page.click('a:has-text("Customers")');
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByText(customerName).first()).toBeVisible();

    // 9. Delete Customer
    // The RowActions renders primary actions as individual buttons
    const row = page.locator('tr', { hasText: customerName });
    await row.getByRole('button', { name: 'Delete' }).click();

    // Confirm deletion in dialog
    await expect(page.getByText('Delete Customer')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // 10. Verify disappearance from the table
    // We use a more specific locator to avoid matching toast notifications or dialogs
    await expect(page.locator('table')).not.toContainText(customerName);
  });
});
