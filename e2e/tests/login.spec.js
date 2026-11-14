const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/login');
});

test('parent logs in and sees the parent home page', async ({ page }) => {
  await page.getByTestId('login-email').fill('parent@demo.test');
  await page.getByTestId('login-password').fill('Demo1234!');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/children$/);
  await expect(
    page.getByRole('heading', { name: 'Çocuklarım' })
  ).toBeVisible();

  await expect(page.getByText('Ege Örnek')).toBeVisible();
});

test('wrong password shows an error and stays on login', async ({ page }) => {
  await page.getByTestId('login-email').fill('parent@demo.test');
  await page.getByTestId('login-password').fill('wrong-password');
  await page.getByTestId('login-submit').click();

  await expect(
    page.getByTestId('login-error')
  ).toContainText('E-posta veya şifre hatalı');

  await expect(page).toHaveURL(/\/login$/);
});

test('child logs in and sees only the child navigation', async ({ page }) => {
  await page.getByTestId('login-email').fill('child@demo.test');
  await page.getByTestId('login-password').fill('Demo1234!');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/my-tasks$/);

  await expect(
    page.getByRole('heading', { name: 'Görevlerim' })
  ).toBeVisible();

  await expect(
    page.getByRole('link', { name: 'Çocuklarım' })
  ).toHaveCount(0);

  await expect(
    page.getByRole('link', { name: 'Bağlı çocuklar' })
  ).toHaveCount(0);
});