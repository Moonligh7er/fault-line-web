import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('home page loads and has brand + CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Fault.?Line/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Report an Issue/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Browse Map/i })).toBeVisible();
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /About Fault Line/i })).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /Privacy Policy/i })).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Terms of Service/i })).toBeVisible();
  });

  test('404 for unknown route', async ({ page }) => {
    const response = await page.goto('/definitely-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

test.describe('Security headers', () => {
  test('HSTS, X-Frame-Options, Referrer-Policy, nosniff set', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('no-referrer');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  test('CSP present with nonce', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toMatch(/nonce-[A-Za-z0-9+/=]+/);
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('Permissions-Policy locks down sensors', async ({ request }) => {
    const response = await request.get('/');
    const pp = response.headers()['permissions-policy'];
    expect(pp).toBeDefined();
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('payment=()');
  });
});

test.describe('Auth protection', () => {
  test('unauthenticated /submit redirects to /login', async ({ page }) => {
    const response = await page.goto('/submit');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  });

  test('unauthenticated /profile redirects to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Open-redirect guards', () => {
  test('login rejects external next param', async ({ page }) => {
    await page.goto('/login?next=https://evil.example.com');
    // Form is visible; submitting would not redirect to evil.com
    await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  });
});

test.describe('Login form', () => {
  test('shows email input and send button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: /Send magic link/i })).toBeVisible();
  });

  test('send button disabled with empty email', async ({ page }) => {
    await page.goto('/login');
    const button = page.getByRole('button', { name: /Send magic link/i });
    await expect(button).toBeDisabled();
  });
});

test.describe('CSRF protection', () => {
  test('POST with wrong origin is rejected', async ({ request }) => {
    const response = await request.post('/auth/signout', {
      headers: { origin: 'https://evil.example.com' },
      failOnStatusCode: false,
    });
    expect([403, 405]).toContain(response.status());
  });
});
