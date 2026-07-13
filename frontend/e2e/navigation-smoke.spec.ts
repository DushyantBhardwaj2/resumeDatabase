import { test, expect } from '@playwright/test'

test.describe('Public page navigation', () => {
  test('landing page loads and shows sign-in', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1, h2, strong').first()).toBeVisible()
  })

  test('landing page has a sign-in button', async ({ page }) => {
    await page.goto('/')
    const signInButtons = page.getByRole('button', { name: /sign in/i })
    await expect(signInButtons.first()).toBeVisible()
  })

  test('navigates to sign-in page', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
