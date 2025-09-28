import { test, expect } from '@playwright/test'

test('timer controls respond to user input', async ({ page }) => {
  await page.goto('/')

  const startButton = page.getByRole('button', { name: 'Start' })
  await expect(startButton).toBeVisible()

  await startButton.click()
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()

  await page.keyboard.press('Space')
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible()

  await page.keyboard.press('KeyR')
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible()
})
