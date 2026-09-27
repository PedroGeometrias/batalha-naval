import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/?test=1');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.battle-message')).toHaveCount(0);
});

test('assets load, controls move and shoot, pause freezes time, and a completed game records once', async ({ page }) => {
  const initial = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  await page.keyboard.down('w');
  await page.keyboard.down('d');
  await page.keyboard.down('j');
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(0.5));
  await page.keyboard.up('j');
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  const moved = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  expect(moved.x).toBeGreaterThan(initial.x);
  expect(moved.angle).toBeGreaterThan(initial.angle);
  expect(moved.elapsed).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Game paused' })).toBeVisible();
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(5));
  expect((await page.evaluate(() => window.__PIRATE_TEST__!.snapshot())).elapsed).toBe(moved.elapsed);
  await page.getByRole('button', { name: 'Resume' }).click();
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(120));
  await expect(page.getByRole('heading', { name: 'Result' })).toBeVisible();
  await expect(page.getByText('Recorded')).toBeVisible();
  await page.getByRole('button', { name: 'Main Menu' }).click();
  await page.getByRole('tab', { name: 'Match History' }).click();
  await expect(page.getByRole('row')).toHaveCount(2); // Header and the single completed match.
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByText('SCORE', { exact: true })).toBeVisible();
  await expect(page.locator('.hud-values strong').nth(1)).toHaveText('0');
});

test('abandonment does not create a match record', async ({ page }) => {
  await page.getByRole('button', { name: 'Abandon match' }).click();
  await page.getByRole('tab', { name: 'Match History' }).click();
  await expect(page.getByText('No matches on this page.')).toBeVisible();
});

test('the sea keeps only nearby tiles and moving boats leave a fading wake', async ({ page }) => {
  const start = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  expect(start.visibleTiles).toBeGreaterThan(0);
  expect(start.visibleTiles).toBeLessThan(56*56);
  expect(start.wakes).toBe(0);
  await page.keyboard.down('w');
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(.5));
  await page.keyboard.up('w');
  const moved = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  expect(moved.wakes).toBeGreaterThan(0);
  expect(moved.visibleTiles).toBeLessThan(56*56);
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(1));
  expect((await page.evaluate(() => window.__PIRATE_TEST__!.snapshot())).wakes).toBe(0);
});

test('the sound control can mute and resume the voyage audio', async ({ page }) => {
  const mute = page.getByRole('button', { name: 'Mute sound' });
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
  await mute.click();
  const unmute = page.getByRole('button', { name: 'Unmute sound' });
  await expect(unmute).toHaveAttribute('aria-pressed', 'false');
  await unmute.click();
  await expect(mute).toHaveAttribute('aria-pressed', 'true');
});

test('touch movement works on mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Touch control layout is shown on mobile.');
  const start = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  const box = await page.getByRole('button', { name: 'Sail', exact: true }).boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x+box!.width/2, box!.y+box!.height/2);
  await page.mouse.down();
  await page.evaluate(() => window.__PIRATE_TEST__!.advance(0.5));
  await page.mouse.up();
  const finish = await page.evaluate(() => window.__PIRATE_TEST__!.snapshot());
  expect(finish.x).toBeGreaterThan(start.x);
});
