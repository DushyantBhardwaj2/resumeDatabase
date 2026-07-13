import { test, expect } from '@playwright/test'

test.describe('Landing page smoke tests', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('navigation links are present', async ({ page }) => {
    await page.goto('/')
    const signInBtn = page.getByRole('button', { name: /sign in/i })
    const navLinks = page.getByRole('link')
    const linkCount = await navLinks.count()
    expect(linkCount).toBeGreaterThan(0)
  })

  test('page has correct HTML lang attribute', async ({ page }) => {
    await page.goto('/')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBeTruthy()
  })
})
